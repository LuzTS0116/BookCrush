const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get a list of all .ts files in the project
const getAllTsFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      fileList = getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
};

// Update imports in a file
const updateImportsInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip files that don't have the import
  if (!content.includes('@/lib/generated/prisma')) {
    return;
  }
  
  console.log(`Updating imports in ${filePath}`);
  
  // Replace PrismaClient import
  content = content.replace(
    /import\s+{\s*PrismaClient(\s*,?[^}]*)?\s*}\s+from\s+(['"])@\/lib\/generated\/prisma\2/g,
    (match, imports, quote) => {
      // If imports contains other Prisma types, we need to handle them separately
      if (imports && imports.trim()) {
        return `import { PrismaClient } from ${quote}@prisma/client${quote}${imports}`;
      }
      return `import { PrismaClient } from ${quote}@prisma/client${quote}`;
    }
  );
  
  // Replace specific type imports
  content = content.replace(
    /import\s+{([^}]*)}\s+from\s+(['"])@\/lib\/generated\/prisma\2/g,
    (match, imports, quote) => {
      // Only keep Prisma import if it's not just types
      if (imports.includes('PrismaClient')) {
        let newImports = imports.replace(/\bPrismaClient\b,?/g, '').trim();
        if (newImports.startsWith(',')) newImports = newImports.substring(1).trim();
        
        if (newImports) {
          return `import { PrismaClient } from ${quote}@prisma/client${quote}\nimport { ${newImports} } from ${quote}@prisma/client${quote}`;
        }
        return `import { PrismaClient } from ${quote}@prisma/client${quote}`;
      }
      
      return `import { ${imports} } from ${quote}@prisma/client${quote}`;
    }
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
};

// Main execution
try {
  const rootDir = process.cwd();
  console.log('Scanning for TypeScript files...');
  const allTsFiles = getAllTsFiles(rootDir);
  console.log(`Found ${allTsFiles.length} TypeScript files.`);
  
  let updatedCount = 0;
  allTsFiles.forEach(file => {
    try {
      updateImportsInFile(file);
      updatedCount++;
    } catch (err) {
      console.error(`Error updating ${file}:`, err);
    }
  });
  
  console.log(`Updated imports in ${updatedCount} files.`);
  console.log('Done!');
} catch (err) {
  console.error('Error:', err);
} 