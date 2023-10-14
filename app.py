from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import subprocess
import os
import re
import concurrent.futures  # Import the concurrent.futures module
from type_declaration_generator import generate_type_declarations, generate_header_content
# from type_declaration_generator import generate_header_content


app = Flask(__name__)
CORS(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})



# Add caching headers
@app.after_request
def add_cache_headers(response):
    # Set cache control headers to prevent caching
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response




def generate_return_statement(return_type):
    # Map user-defined return types to return statements
    return_mapping = {
        'int': 'return 0;',
        'char': 'return \'\\0\';',
        'float': 'return 0.0f;',
        'double': 'return 0.0;',
        'void': '',  # No return statement for void functions
        'short': 'return 0;',
        'long': 'return 0;',
        'unsigned int': 'return 0;',
        'char': 'return \'\\0\';',
        'unsigned short': 'return 0;',
        'unsigned long': 'return 0;',
        'int32_t': 'return 0;', 
        'int16_t': 'return 0;', 
        'int8_t': 'return 0;', 
        # Add more return type cases as neededs
    }
    return return_mapping.get(return_type)


def generate_library_helper(data):
    try:
        library_name = data['libraryName']
        user_inputs = data['userInputs']
        rightPanelFunctions = data.get('rightPanelFunctions', [])
        library_type = data['libraryType']  # Get the library type from the request

        

        
        # Combine user_inputs and moved_functions
        all_inputs = user_inputs + rightPanelFunctions

          # Print inputs for debugging
        print("All Inputs:")
        print(all_inputs)



        # Print moved functions for debugging
        print("Moved Functions:")
        print(rightPanelFunctions)

        # Generate type declarations based on user inputs
        type_declarations = generate_type_declarations(all_inputs)

        # Generate the header file content
        header_filename = f'{library_name}_header.h'
        generate_header_content(all_inputs, header_filename)

        # Create a temporary file containing user inputs in the desired format
        temp_filename = f'{library_name}_inputs.c'
        with open(temp_filename, 'w') as f:
            # Include the generated header file
            f.write(f'#include "{header_filename}"\n\n')
            f.write(f'#include <stdio.h>\n\n')

            # Initialize user_return_type to None
            user_return_type = None

            # Generate C source code for user inputs
            c_source_content = ""

            # Generate C source code for user inputs
            c_source_content = ""
            for input_text in all_inputs:
                
                # Remove any semicolon at the end of the input_text
                input_text = input_text.rstrip(';').strip()

                # Extract the first word (user_return_type) from input_text
                parts = input_text.split()
                if len(parts) >= 2:
                    user_return_type = parts[0]
                    #input_text = ' '.join(parts[1:])  # Remove the first word from input_text

                c_source_content += f'{input_text}\n'
                c_source_content += '{\n'
                c_source_content += '    // Function Implementation\n'
                c_source_content += '    printf("FUNCTION is CALLED!          ");\n'
                c_source_content += '\n'
                c_source_content += '    printf("LIBRARY STATUS: OK!          ");\n'



                if user_return_type:
                    # Generate a return statement based on user_return_type
                    return_statement = generate_return_statement(user_return_type)
                    if return_statement:
                        c_source_content += f'    {return_statement}\n'

                c_source_content += '};\n\n'

            f.write(c_source_content)

        # Determine the file extension based on the library type
        # file_extension = '.a' if library_type == 'Static' else '.so'

        if library_type == 'Static':
            # Compile the library using gcc
            compile_command = f'gcc -c -o {library_name}.o {temp_filename}'
            subprocess.run(compile_command, shell=True)

            # compile_command = f'gcc -c -o {object_file} {temp_filename}'
            # subprocess.run(compile_command, shell=True)

            # Create the static library
            archive_command = f'ar rcs lib{library_name}.a {library_name}.o'
            subprocess.run(archive_command, shell=True)   

            # archive_command = f'ar rcs {library_file} {object_file}'
            # subprocess.run(archive_command, shell=True)   

            #Debugging/ Utility Function
            completed_process = subprocess.run(compile_command, shell=True, capture_output=True, text=True)
            print('Compilation Output:', completed_process.stdout)
            print('Compilation Error:', completed_process.stderr)


            # Clean up temporary files
            # os.remove(f'{library_name}.o')
            # os.remove('user_inputs.txt')
            # os.remove(temp_filename)

            for declaration in type_declarations:
                print("\n\nDeclared function")
                print(declaration)  # Example: Print the generated declarations
        
        elif library_type =='Shared':
            # Compile the C source file into an object file
            #compile_command = f'gcc -c -o {library_name}.o {temp_filename}'
            compile_command = f'gcc -c -fPIC -o {library_name}.o {temp_filename}'
            subprocess.run(compile_command, shell=True)

            # Compile the C source file into a shared library
            #compile_command = f'gcc -shared -o lib{library_name}.so {temp_filename}'
            compile_command = f'gcc -shared -o lib{library_name}.so {library_name}.o'
            subprocess.run(compile_command, shell=True)

            # compile_command = f'gcc -shared -o {library_file} {temp_filename}'
            # subprocess.run(compile_command, shell=True)

             #Debugging/ Utility Function
            completed_process = subprocess.run(compile_command, shell=True, capture_output=True, text=True)
            print('Compilation Output:', completed_process.stdout)
            print('Compilation Error:', completed_process.stderr)

            #  # Clean up temporary files
            # os.remove(f'{library_name}.o')
            # os.remove('user_inputs.txt')
            # os.remove(temp_filename)

            for declaration in type_declarations:
                print("\n\nDeclared function")
                print(declaration)  # Example: Print the generated declarations

        # return {'message': f'{library_type} library created successfully'}

        return {}  # Or return None

    except Exception as e:
        print('Error:', str(e))
        return {'message': 'Error creating library(BackEnd) / Invalid Format for a Function'}, 500 # Return a 500 status code for internal server error
    


@app.route('/generate_library', methods=['POST'])
def generate_library():
    try:
        data = request.json
        # Create a thread pool executor
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Submit the generate_library_helper function with the data
            future = executor.submit(generate_library_helper, data)

            # Wait for the result
            result = future.result()

        return result

    except Exception as e:
        print('Error:', str(e))
        return {'message': 'Error creating library'}, 500
    

@app.route('/download_library', methods=['GET'])
def download_library():
    try:
        library_name = request.args.get('libraryName')
        library_type = request.args.get('libraryType')  # Get the library type from the request

        # Determine the correct file extension based on the library type
        file_extension = '.a' if library_type == 'Static' else '.so'

        file_path = f'lib{library_name}{file_extension}'

        
        print("Library Name:", library_name)
        print("Library Type:", library_type)
        print("File Path:", file_path)

         # Make sure the file exists before sending it
        if os.path.exists(file_path):
            # Set the appropriate MIME type
            mime_type = "application/octet-stream"

            # Create the response object with the file and headers
            response = send_file(file_path, as_attachment=True, mimetype=mime_type)
            response.headers["Content-Disposition"] = f"attachment; filename=lib{library_name}{file_extension}"
            
            return response
        else:
            print("File Not Found")
            return {'message': 'Library file not found / LIBRARY NOT CREATED'}, 404

    except Exception as e:
        print('Error:', str(e))
        return {'message': 'Error downloading library'}, 500
    


# def extract_functions(file_content):
#     # Regular expression to match C function declarations
#     pattern = re.compile(r'\b\w+\s+\w+\s*\([^)]*\)\s*{')
#     matches = pattern.findall(file_content)
#     return matches

# @app.route('/extract-functions', methods=['POST'])
# def extract_functions_from_c_file():
#     data = request.json
#     file_content = data.get('fileContent', '')

#     if not file_content:
#         return jsonify({'error': 'File content is empty'}), 400

#     functions = extract_functions(file_content)
#     return jsonify({'functions': functions})



# @app.route('/extract-functions', methods=['POST'])
# def extract_functions():
#     data = request.get_json()
#     file_content = data.get('fileContent', '')

#     # Use regular expression to extract functions and remove curly braces
#     functions = re.findall(r'\b\w+\s+\w+\([^)]*\)\s*{', file_content)

#     # Remove curly braces from each function
#     functions = [func.replace('{', ';') for func in functions]

#     return jsonify({'functions': functions})



# Adjusted route to exclude curly braces and capture only the function declaration
# @app.route('/extract-functions', methods=['POST'])

# def extract_functions():
#     data = request.get_json()
#     file_content = data.get('fileContent', '')

#     # Use regular expression to extract functions and remove curly braces
#     functions = re.findall(r'\b\w+\s+\w+\([^)]*\)\s*(?=\{)', file_content)

#     # Remove curly braces from each function
#     # functions = [func.strip() + ';' for func in functions]

#     return jsonify({'functions': functions})





@app.route('/extract-functions', methods=['POST'])
def extract_functions():
    data = request.get_json()
    file_content = data.get('fileContent', '')

    # print("Received File Content:")
    # print(file_content)


    # Step 1: Identify and remove comment blocks
    comment_blocks = re.findall(r'/\*.*?\*/', file_content, flags=re.DOTALL)
    # Remove // style comments
    comment_blocks = re.sub(r'//.*', '', file_content)

    # for comment_block in comment_blocks:
    #     file_content = file_content.replace(comment_block, '')  

    # Step 2: Identify potential function-like structures
    potential_functions = re.findall(r'\b((?:\w+\s+)*)(\w+)\s+(\w+)\s*\(([^)]*?)\)\s*(?:{[^{}]*}|[^;]*;)', comment_blocks, flags=re.DOTALL)

    # Debugging: Print potential functions
    print("Potential Functions:")
    print(potential_functions)

    # Step 3: Filter out non-function declarations
    valid_functions = []
    for func_match in potential_functions:
        modifiers, return_type, function_name, parameters = func_match

        # Exclude if it contains known loop or condition structures
        if any(keyword in func_match for keyword in ['for', 'while', 'do', 'foreach', 'if', 'else', 'FOREACH']):
            continue

        # Extract the return type and check if it's one of the included types
        included_return_types = ['int32_t', 'int16_t', 'int8_t', 'int', 'void', 'char', 'double', 'float', 'short', 'long', 'unsigned int', 'unsigned short', 'unsigned long']
        if return_type in included_return_types:
            # Check if the function name is followed by a semicolon or a comment
            if ";" in file_content[file_content.find(function_name) + len(function_name):]:
                # Add modifiers if they were part of the original match
                full_function = f"{modifiers} {return_type} {function_name}({parameters})"
                valid_functions.append(full_function.strip() + ';')

    # Debugging: Print valid functions
    print("Valid Functions:")
    print(valid_functions)

    return jsonify({'functions': valid_functions})








    

if __name__ == '__main__':
    app.run()
