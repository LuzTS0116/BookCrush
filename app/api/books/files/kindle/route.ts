import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { fileId, customEmail } = body;
    
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }
    
    // Get the file details and associated book
    const bookFile = await prisma.bookFile.findUnique({
      where: { id: fileId },
      include: {
        book: {
          select: {
            title: true,
            author: true
          }
        }
      }
    });
    
    if (!bookFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Get user's profile to find Kindle email
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { kindle_email: true, email: true, display_name: true }
    });
    
    // Determine recipient email
    const kindleEmail = customEmail || profile?.kindle_email;
    
    if (!kindleEmail) {
      return NextResponse.json(
        { error: "No Kindle email found. Please update your profile with your Kindle email address or provide a custom email." },
        { status: 400 }
      );
    }
    
    // Get the file from Supabase Storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('books')
      .download(bookFile.storage_key);
    
    if (fileError || !fileData) {
      return NextResponse.json(
        { error: "Failed to retrieve file from storage" },
        { status: 500 }
      );
    }
    
    // Convert file to buffer/base64 for email attachment
    const buffer = await fileData.arrayBuffer();
    const base64File = Buffer.from(buffer).toString('base64');
    
    // Format book title and author for email subject
    const bookTitle = bookFile.book.title || 'Your Book';
    const bookAuthor = bookFile.book.author ? ` by ${bookFile.book.author}` : '';
    const fileName = bookFile.original_name || `${bookTitle}.epub`;
    
    // Prepare the email
    const msg = {
      to: kindleEmail,
      from: process.env.EMAIL_FROM || 'bookcrush@mangodigitalstudio.com', // Verified sender in SendGrid
      subject: `${bookTitle}${bookAuthor} - sent from BookCrush`,
      text: `Here's your book: ${bookTitle}${bookAuthor}. Enjoy reading!`,
      attachments: [
        {
          content: base64File,
          filename: fileName,
          type: bookFile.mime_type || 'application/epub+zip',
          disposition: 'attachment'
        }
      ]
    };
    
    // Send the email
    if (process.env.NODE_ENV === 'production') {
      await sgMail.send(msg);
    } else {
    await sgMail.send(msg);
      // For development, log the email details
      console.log('Development mode - email would be sent with:', {
        to: kindleEmail,
        from: process.env.EMAIL_FROM || 'bookcrush@mangodigitalstudio.com',
        subject: msg.subject,
        attachmentName: fileName
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Book sent to ${kindleEmail}`
    });
    
  } catch (error: any) {
    console.error("Error sending book to Kindle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send book to Kindle" },
      { status: 500 }
    );
  }
} 