import os
import argparse
import sys

# Define the default path
DATA_PATH = "src/"


def convert_mdx_to_md(main_folder):
    """
    Rename all .mdx files to .md in the specified folder and its subfolders.

    Args:
        main_folder (str): Path to the main folder to process.
    """
    for root, dirs, files in os.walk(main_folder):
        for file in files:
            if file.endswith('.mdx'):
                # Construct full paths for old and new file names
                old_path = os.path.join(root, file)
                new_file = file[:-4] + '.md'  # Replace '.mdx' with '.md'
                new_path = os.path.join(root, new_file)
                try:
                    os.rename(old_path, new_path)
                    print(f"Renamed: {old_path} to {new_path}")
                except Exception as e:
                    print(f"Error renaming {old_path}: {e}")


if __name__ == '__main__':
    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(
        description='Convert .mdx files to .md in a folder and its subfolders. Defaults to "src/" if no folder is provided.'
    )
    parser.add_argument(
        'folder',
        nargs='?',
        default=DATA_PATH,
        type=str,
        help='The main folder to process (default: src/)'
    )
    args = parser.parse_args()

    # Check if the specified folder exists and is a directory
    if not os.path.isdir(args.folder):
        print(f"Error: '{args.folder}' is not a valid directory.")
        sys.exit(1)

    # Run the conversion function with the provided or default folder path
    convert_mdx_to_md(args.folder)