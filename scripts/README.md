# Tone Examples Upload Scripts

## Bulk Upload Script

Perfect for uploading your 15+ .md files and weekly content updates.

### Usage

```bash
# Upload all .md files from a directory
node scripts/upload-tone-examples.js /path/to/your/md/files/

# Clear existing tone examples and upload fresh ones
node scripts/upload-tone-examples.js /path/to/your/md/files/ --clear
```

### Examples

```bash
# If your .md files are in a 'content' folder
node scripts/upload-tone-examples.js ./content/

# Upload from Desktop (replace with your path)
node scripts/upload-tone-examples.js ~/Desktop/my-writing/

# Clear old examples and upload new ones
node scripts/upload-tone-examples.js ./content/ --clear
```

### What It Does

1. **Finds all .md files** in the specified directory
2. **Uploads them as tone examples** to your database
3. **Shows progress** with success/failure counts
4. **Works with your existing Supabase setup**

### Perfect For

- **Initial upload** of your 15 .md files
- **Weekly updates** when you add new content
- **Batch management** instead of uploading one by one

### Requirements

- Node.js installed
- Your `.env.local` file configured with Supabase credentials
- .md files in a directory

### Tips

- Use `--clear` when you want to replace all existing tone examples
- The script only processes .md files (safe to have other files in the directory)
- Each file becomes a separate tone example the AI can learn from 