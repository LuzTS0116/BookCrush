import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface ShareAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadedImageUrl: string | null;
  loading: boolean;
}

export function ShareAchievementDialog({
  open,
  onOpenChange,
  downloadedImageUrl,
  loading,
}: ShareAchievementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw] rounded-2xl px-0 py-1 text-secondary">
        <Image
          src="/images/background.png"
          alt="Share achievement background"
          width={1622}
          height={2871}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        {!downloadedImageUrl ? (
          <div className="text-center p-6">
            <p className="text-sm text-red-500">Oops! Something went wrong while generating your image. Try again.</p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-4">
              <DialogTitle className="mt-7 text-center text-xl font-semibold">
                🎉 Your review has been submitted!
              </DialogTitle>
              <DialogDescription className="text-center text-sm mt-2 text-secondary-light/80">
                Want to share your reading achievement with your friends? Download this image and share it on your favorite platform!
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-0 px-4">
              <div className="h-[45vh] w-auto overflow-hidden mx-auto rounded-lg shadow-md">
                <img
                  src={downloadedImageUrl}
                  alt="Book achievement preview"
                  className="h-full w-auto object-contain mx-auto"
                />
              </div>

              <div className="flex justify-end mt-4">
                <a
                  href={downloadedImageUrl}
                  onClick={shareDialogCallback}
                  download="reading-achievement.png"
                  className="bg-primary text-secondary px-4 py-2 rounded-full text-sm hover:bg-primary-dark transition"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Download and Share</>
                  )}
                </a>
              </div>
            </div>

            <DialogFooter />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}