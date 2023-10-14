//rightPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import Modal from './modals/summaryFunction';
import './rightpanel.css';
import { downloadLibraryURL } from './modals/api';


const RightPanel = ({ movedFunctions, rightPanelFunctions, setRightPanelFunctions }) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadReady, setIsDownloadReady] = useState(false);
  const [isLibraryCreated, setIsLibraryCreated] = useState(false);
  // Initial value could be the value of the default selected option. This is for the radio button
  const [selectedOption, setSelectedOption] = useState('Static');
  //This is for the library name
  const [inputValue, setInputValue] = useState('');
  const [val, setVal] = useState([]);
  // This is for the Function List 
  const inputRefs = useRef([]);
  const [selectedInput, setSelectedInput] = useState([]); // Track selected input
  const [clickedInput, setClickedInput] = useState(null); // State variable to track the clicked input field
  const [clickedFunction, setClickedFunction] = useState(null); // State variable to track the clicked movedFunction

  const createLibrary = async () => {
    // Validate the library name using a regular expression
    const libraryNameRegex = /^[a-zA-Z0-9_-]{1,12}$/;
    const functionRegex = /^\s*(?:(?:\w+\s+)*)(\w+\s+)?\w+\s+[a-zA-Z_]\w*\s*\(((?:(?!\s*;)[^()]|\([^;()]*\))*)\);\s*$/;

    if (!libraryNameRegex.test(inputValue)) {
      alert('Library name must be 1 to 12 characters long, consisting of letters, numbers, underscores, or dashes only.');
      return;
    }

    // Check if there are any non-function entries in generated input fields
    const invalidInputs = val.filter((input) => input.trim() && !functionRegex.test(input.trim()));
    const invalidTabFunctions = rightPanelFunctions.filter((func) => func.trim() && !functionRegex.test(func.trim()));

    if (invalidInputs.length > 0 || invalidTabFunctions.length > 0) {
      let errorMessage = '';
      if (invalidInputs.length > 0) {
        errorMessage += `Invalid function format in generated input fields. Please check the following entries:\n${invalidInputs.join('\n')}\n\n`;
      }
      if (invalidTabFunctions.length > 0) {
        errorMessage += `Invalid function format in functions from tab.js. Please check the following entries:\n${invalidTabFunctions.join('\n')}`;
      }
      alert(errorMessage);
      return;
    }


    // Check if there are no generated input fields or selected functions
    if ((val.length === 0 || val.every((input) => !input.trim())) && (rightPanelFunctions.length === 0 || rightPanelFunctions.every((func) => !func.trim()))) {
      alert('Please provide at least one user input or selected function before creating the library.');
      return;
    }

    // Validate each generated input field format
    for (const input of val) {
      if (!input.trim()) {
        alert('Please fill in all user input fields before creating the library.');
        return;
      }
      if (!functionRegex.test(input.trim())) {
        alert(`Invalid function format in generated input fields: "${input}". Function format should be like "int functionName(<parameters>);" Check for spaces.`);
        return;
      }
      const match = input.trim().match(functionRegex);
      const additionalModifier = match[1];
      if (additionalModifier && additionalModifier.trim() === 'inline') {
        // 'inline' modifier is present
        console.log(`Function "${input}" has the 'inline' modifier.`);
      }
    }

    // Validate each selected function format
    for (const func of rightPanelFunctions) {
      if (!func.trim()) {
        alert('Please fill in all selected functions before creating the library.');
        return;
      }
      if (!functionRegex.test(func)) {
        alert(`Invalid function format in moved functions: "${func}". Function format should be like "int functionName(<parameters>);".`);
        return;
      }
      const match = func.trim().match(functionRegex);
      const additionalModifier = match[1];
      if (additionalModifier && additionalModifier.trim() === 'inline') {
        // 'inline' modifier is present
        console.log(`Function "${func}" has the 'inline' modifier.`);
      }
    }


     // Check for duplicate functions in generated input fields
  const duplicateGeneratedInputs = val.some((input, index) => val.slice(0, index).includes(input));
  if (duplicateGeneratedInputs) {
    const duplicatedInputs = findDuplicates(val);
    alert(`Duplicate functions found in generated input fields. Duplicated functions:\n${duplicatedInputs.join('\n')}\nPlease enter unique functions.`);
    return;
  }

  // Check for duplicate functions in selected functions
  const duplicateSelectedFunctions = rightPanelFunctions.some((func, index) => rightPanelFunctions.slice(0, index).includes(func));
  if (duplicateSelectedFunctions) {
    const duplicatedFunctions = findDuplicates(rightPanelFunctions);
    alert(`Duplicate functions found in selected functions. Duplicated functions:\n${duplicatedFunctions.join('\n')}\nPlease enter unique functions.`);
    return;
  }

    // Proceed to open the modal
    setIsModalOpen(true);
  };

  // Function to find duplicates in an array
  const findDuplicates = (arr) => {
    const countedValues = arr.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(countedValues).filter((key) => countedValues[key] > 1);
  };

  const resetFields = () => {
    setInputValue('');
    setSelectedOption('Static');
    setVal(['']);
  };

  const clearDownload = () => {
    setIsDownloadReady(false);
  };



  const handleDownloadLibrary = async () => {
    if (isDownloadReady) {
      const queryParams = new URLSearchParams({
        libraryName: inputValue,
        libraryType: selectedOption,
      });
      const downloadURL = `${downloadLibraryURL}?${queryParams.toString()}`;

      const link = document.createElement('a');
      link.href = downloadURL;
      link.target = '_blank'; // Open the download link in a new tab
      link.download = `lib${inputValue}.${selectedOption === 'Static' ? 'a' : 'so'}`;
      link.click();

      // Reset the states after downloading
      resetFields();
      clearDownload();
    } else {
      alert('Library is not ready for download yet.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const confirmModal = () => {

    setIsModalOpen(false);
    setIsLibraryCreated(true); // Set the state to indicate library creation
  }

  //------------------------------------------------------------------------------------------------------------------------------------------------  

  const handleAdd = () => {
    // Check if there are any empty input fields
    if (val.some((input) => input.trim() === '')) {
      alert('Please fill in all previous input fields before adding a new one.');
      return;
    }

    // If all previous input fields are filled, add a new one
    const abc = [...val, ''];
    setVal(abc);
    inputRefs.current.push(React.createRef());
  };


  const handleChange = (onChangeValue, i) => {
    const inputdata = [...val];
    inputdata[i] = onChangeValue.target.value;

    setVal(inputdata);

  };

  const handleInputClick = (i) => {
    // Select the input field when clicked
    // If the input field is already selected, remove it
    if (selectedInput.includes(i)) {
      setSelectedInput(selectedInput.filter((index) => index !== i));
    } else {
      // If it's not selected, add it
      setSelectedInput([...selectedInput, i]);
    }
    setClickedInput(i);
  };


  const handleSelectedFunctionClick = (index) => {
    setClickedFunction(index === clickedFunction ? null : index);
  };

  const handleDelete = () => {
    const updatedVal = [...val];
    const updatedRefs = [...inputRefs.current];
    const updatedMovedFunctions = [...rightPanelFunctions];

    if (clickedInput !== null) {
      // If a clicked input field is tracked, delete it
      updatedVal.splice(clickedInput, 1);
      updatedRefs.splice(clickedInput, 1);
      setClickedInput(null); // Reset the clicked input field
    } else if (clickedFunction !== null) {
      // If a clicked movedFunction is tracked, delete it
      updatedMovedFunctions.splice(clickedFunction, 1);
      setClickedFunction(null); // Reset the clicked movedFunction
    } else if (val.length > 0) {
      // If no movedFunctions and 'clickedInput' are provided, delete the last generated input field by default
      updatedVal.pop();
      updatedRefs.pop();
    } else if (rightPanelFunctions.length > 0) {
      // If 'clickedInput' and 'clickedFunction' are not provided, delete the last rightPanelFunction by default
      updatedMovedFunctions.pop();
    }

    setVal(updatedVal);
    inputRefs.current = updatedRefs;
    setRightPanelFunctions(updatedMovedFunctions);
  };


  const handleSelectedFunctionChange = (e, index) => {
    const updatedFunctions = [...rightPanelFunctions];
    updatedFunctions[index] = e.target.value;
    setRightPanelFunctions(updatedFunctions);
    setClickedFunction(null); // Reset the clicked movedFunction
  };

  // Display the alert after the modal is closed
  useEffect(() => {
    if (isLibraryCreated) {
      alert('Library created successfully');
      setIsLibraryCreated(false); // Reset the state
    }
  }, [isLibraryCreated]);


  return (
    <div>
      {/* This is for the right panel--------------------------------------------------------------------------------------------------------*/}
      <div className="right-panel">

        <form>
          <input
            className="library-name"
            required
            name='name'
            type="text"
            placeholder='ENTER LIBRARY NAME'
            value={inputValue}
            onChange={(e) => {
              // Check the length of the input value and trim it if it exceeds 8 characters
              if (e.target.value.length <= 12) {
                setInputValue(e.target.value);
              }
            }}
            maxLength={12} // Set the maximum length to 12 characters

          ></input>

          <input
            className="library-type"
            name='type'
            type="radio"
            value="Static"
            checked={selectedOption === 'Static'}
            onChange={() => setSelectedOption('Static')}
          />
          <label className='label' htmlFor="staticRadio">Static</label>
          <span></span>

          <input
            className="library-type"
            name='type'
            type="radio"
            value="Shared"
            checked={selectedOption === 'Shared'}
            onChange={() => setSelectedOption('Shared')}
          />
          <label className='label' htmlFor="sharedRadio">Shared</label>
          <span></span>

        </form>

        <div className="function-list-right-panel ">

          {/* Display the selected functions in the right panel */}
          {rightPanelFunctions && rightPanelFunctions.map((func, index) => (
            <div key={index} className={`selected-function ${clickedFunction === index ? 'selected' : ''}`}>
              <input
                className="added-Function"
                type="text"
                value={func}
                onChange={(e) => handleSelectedFunctionChange(e, index)}
                onClick={() => handleSelectedFunctionClick(index)}
              />
            </div>
          ))}






          {val.map((data, i) => (
            <div key={i} className={`input-row ${selectedInput.includes(i) ? 'selected' : ''}`}>
              <input
                className="added-Function"
                type="text"
                value={data}
                onChange={(e) => handleChange(e, i)}
                ref={inputRefs.current[i]}
                onClick={() => handleInputClick(i)}
              />

            </div>
          ))}

        </div>
        <div className='function-button'>
          <button className="remove-button button-color" onClick={() => handleDelete()}>&#10006;</button>
          <button className="edit-button button-color" onClick={() => handleAdd()}>&#10006;</button>
        </div>


        {/*This is for the name */}
        {selectedOption === 'Static' ? (
          inputValue !== '' && <p id='lib-name'><i>Name:</i> lib{inputValue}.a</p>
        ) : (
          inputValue !== '' && <p id='lib-name'><i>Name:</i> lib{inputValue}.so</p>
        )}

        <button className='create-button' onClick={createLibrary}>Create</button>
        <button className={`download-button ${isDownloadReady ? 'ready' : ''}`}
          onClick={handleDownloadLibrary}>
          Download
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          confirmModal={confirmModal}
          libraryName={inputValue}
          libraryType={selectedOption}
          userInputs={val}
          movedFunctions={movedFunctions}
          selectedOption={selectedOption} // Pass selectedOption as a prop
          setIsDownloadReady={setIsDownloadReady}
          rightPanelFunctions={rightPanelFunctions}
        />

      </div>
    </div >
  )

};

export default RightPanel;
