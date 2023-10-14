import re
import concurrent.futures


# Initialize an empty dictionary for user-defined parameter types
user_defined_parameter_types = {}

# Function to handle user-defined parameter types
def handle_user_defined_parameter_type(type_name):
    return user_defined_parameter_types.get(type_name, type_name)

# Function to parse input and extract function name, return type, and parameters
def parse_input_to_extract_name_and_parameters(input_text):
    # Define a regular expression pattern to match function declarations
    pattern = r'([\w\s\*]+)\s+(\w+)\s*\(([^)]*)\);'
    match = re.match(pattern, input_text)
    
    if match:
        return_type = match.group(1)
        function_name = match.group(2)
        parameter_list = match.group(3)

        # Split parameters list by commas to get individual parameters
        parameters = [param.strip() for param in parameter_list.split(',')]

        return function_name, return_type, parameters
    else:
        return None

# Function to generate a function declaration
def generate_declaration(function_name, return_type, parameters):
    default_return_type = "RETURN_TYPE"
    default_parameters = "PARAMETERS"
    
    # Generate default definitions for user-defined types
    default_return_type = handle_user_defined_type(default_return_type)
    default_parameters = [handle_user_defined_type(param) for param in default_parameters.split(',')]
    
    # Generate the complete function declaration
    declaration = f"{return_type if return_type else default_return_type} {function_name}({', '.join(parameters) if parameters else ', '.join(default_parameters)});"
    return declaration

# Function to handle user-defined types
def handle_user_defined_type(type_name):
    return type_name  # Use default value if defined, otherwise use the type name

# Function to generate type declarations and function declarations
def generate_type_declarations(user_inputs):
    type_declarations = []
      # Define a function for concurrent execution
    def process_input(input_text):
        
        function_name, return_type, parameters = parse_input_to_extract_name_and_parameters(input_text)
        type_declaration = generate_declaration(function_name, return_type, parameters)
        return type_declaration

    # Use ThreadPoolExecutor for concurrent execution
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Submit tasks for each input in parallel
        future_to_input = {executor.submit(process_input, input_text): input_text for input_text in user_inputs}

        # Collect results as they complete
        for future in concurrent.futures.as_completed(future_to_input):
            input_text = future_to_input[future]
            try:
                type_declaration = future.result()
                type_declarations.append(type_declaration)
            except Exception as e:
                print(f"Error processing input '{input_text}': {e}")
    return type_declarations

# Function to generate header content
def generate_header_content(user_inputs, header_filename):
    # Convert the header filename to uppercase and replace non-alphanumeric characters with underscores
    header_guard = re.sub(r'[^a-zA-Z0-9_]', '_', header_filename.upper())

    header_content = f"#ifndef {header_guard}\n"
    header_content += f"#define {header_guard}\n\n"
    
    header_content += "#include <stdint.h>\n\n"

    # Set to keep track of user-defined types already declared
    declared_user_defined_types = set()

    # Generate typedef struct declarations based on user inputs
    for input_text in user_inputs:
        function_name, return_type, parameters = parse_input_to_extract_name_and_parameters(input_text)
        for param in parameters:
            if param.startswith("STR_") and param not in declared_user_defined_types:
                # Extract the first word or phrase (function name)
                struct_name = param.split(' ', 1)[0].strip()
                # Remove the first word (function name) and spaces
                #struct_name = param.replace(param_type, '').strip()
                # # Replace spaces with semicolons
                # struct_name = param.replace(' ', ';')
                # This is a struct declaration
                header_content += f"typedef struct {{\n    // Implementation\n}} {struct_name};\n\n"
                declared_user_defined_types.add(param)

    
    # Generate function declarations based on user inputs
    # Define a function for concurrent execution
    def process_input(input_text):
        function_name, return_type, parameters = parse_input_to_extract_name_and_parameters(input_text)
        type_declaration = generate_declaration(function_name, return_type, parameters)
        return type_declaration
    
    # Use ThreadPoolExecutor for concurrent execution
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Submit tasks for each input in parallel
        future_to_input = {executor.submit(process_input, input_text): input_text for input_text in user_inputs}

        # Collect results as they complete
        for future in concurrent.futures.as_completed(future_to_input):
            input_text = future_to_input[future]
            try:    
                type_declaration = future.result()
                # Append the type declaration to the header content
                header_content += type_declaration + '\n'
            except Exception as e:
                print(f"Error processing input '{input_text}': {e}")

    header_content += f"\n#endif // {header_guard}\n"


    with open(header_filename, 'w') as header_file:
        header_file.write(header_content)

