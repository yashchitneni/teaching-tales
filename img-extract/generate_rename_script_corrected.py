import re
import os

def generate_rename_script_corrected():
    """
    Parses the raw-clean.txt file and generates a corrected shell script
    for renaming sequentially numbered images based on their alt tags.
    """
    raw_file_path = 'img-extract/all-image-for-script/raw-clean.txt'
    image_dir_library = 'img-extract/teachtales_images_library/'
    output_script_path = 'img-extract/rename_images_corrected.sh'

    rename_commands = []
    seen_new_filenames = set()
    image_counter = 1

    with open(raw_file_path, 'r') as f:
        for line in f:
            match = re.search(r'<img src="[^"]+" alt="([^"]+)"', line)
            if match:
                alt_text = match.group(1)
                
                # The original files are named image_1.webp, image_2.webp, etc.
                original_filename = f"image_{image_counter}.webp"
                original_path = os.path.join(image_dir_library, original_filename)

                # Sanitize alt text for the new filename
                alt_text = alt_text.replace('&amp;', 'and')
                new_filename_base = re.sub(r'[^a-zA-Z0-9_.]', '', alt_text.replace(' ', '_')).lower()
                
                extension = '.webp'
                new_filename = f"{new_filename_base}{extension}"
                
                # Handle potential duplicate new filenames
                counter = 1
                temp_filename = new_filename
                while temp_filename in seen_new_filenames:
                    temp_filename = f"{new_filename_base}_{counter}{extension}"
                    counter += 1
                new_filename = temp_filename
                seen_new_filenames.add(new_filename)

                new_path = os.path.join(image_dir_library, new_filename)

                # Generate the mv command, checking for the file's existence
                rename_commands.append(f'if [ -f "{original_path}" ]; then\n')
                rename_commands.append(f'  mv "{original_path}" "{new_path}"\n')
                rename_commands.append(f'fi\n')
                
                image_counter += 1

    with open(output_script_path, 'w') as f:
        f.write('#!/bin/bash\n')
        f.write('# This script renames images based on the alt tags from raw-clean.txt (Corrected)\n\n')
        f.writelines(rename_commands)

    print(f"Generated corrected renaming script at {output_script_path}")
    os.chmod(output_script_path, 0o755)

if __name__ == '__main__':
    generate_rename_script_corrected()
