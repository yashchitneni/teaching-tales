import re
import os

def generate_rename_script():
    """
    Parses the raw-clean.txt file to generate a shell script for renaming images
    based on their alt tags.
    """
    raw_file_path = 'img-extract/all-image-for-script/raw-clean.txt'
    image_dir_library = 'img-extract/teachtales_images_library/'
    image_dir_images = 'img-extract/teachtales_images/'
    output_script_path = 'img-extract/rename_images.sh'

    # Ensure the image directories exist
    os.makedirs(image_dir_library, exist_ok=True)
    os.makedirs(image_dir_images, exist_ok=True)

    rename_commands = []
    seen_new_filenames = set()

    with open(raw_file_path, 'r') as f:
        for line in f:
            # Look for img tags
            match = re.search(r'<img src="([^"]+)" alt="([^"]+)"', line)
            if match:
                url = match.group(1)
                alt_text = match.group(2)

                # Extract original filename from URL
                original_filename = os.path.basename(url)

                # Sanitize alt text to create a new filename
                # Replace '&amp;' with 'and'
                alt_text = alt_text.replace('&amp;', 'and')
                # Replace spaces and special characters with underscores, and convert to lowercase
                new_filename_base = re.sub(r'[^a-zA-Z0-9_.]', '', alt_text.replace(' ', '_')).lower()
                
                # Get the file extension
                extension = os.path.splitext(original_filename)[1]
                if not extension:
                    extension = '.webp' # default to webp if no extension found

                new_filename = f"{new_filename_base}{extension}"
                
                # Handle potential duplicate new filenames
                counter = 1
                temp_filename = new_filename
                while temp_filename in seen_new_filenames:
                    temp_filename = f"{new_filename_base}_{counter}{extension}"
                    counter += 1
                new_filename = temp_filename
                seen_new_filenames.add(new_filename)


                # Check in which directory the original file might exist and create the mv command
                original_path_library = os.path.join(image_dir_library, original_filename)
                original_path_images = os.path.join(image_dir_images, original_filename)

                # We don't know for sure where the file is, so we'll generate commands
                # assuming it could be in either. The script will only execute the one that finds the file.
                # A better approach would be to check existence first, but for generating a script, this is safer.
                
                # To make the script more robust, we'll check for file existence before moving
                rename_commands.append(f'if [ -f "{original_path_library}" ]; then\n')
                rename_commands.append(f'  mv "{original_path_library}" "{os.path.join(image_dir_library, new_filename)}"\n')
                rename_commands.append(f'elif [ -f "{original_path_images}" ]; then\n')
                rename_commands.append(f'  mv "{original_path_images}" "{os.path.join(image_dir_images, new_filename)}"\n')
                rename_commands.append(f'fi\n')


    with open(output_script_path, 'w') as f:
        f.write('#!/bin/bash\n')
        f.write('# This script renames images based on the alt tags from raw-clean.txt\n\n')
        f.writelines(rename_commands)

    print(f"Generated renaming script at {output_script_path}")
    # Make the script executable
    os.chmod(output_script_path, 0o755)

if __name__ == '__main__':
    generate_rename_script()
