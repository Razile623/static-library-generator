//tab.js
import React, { useState, useRef, useEffect } from 'react';
import './leftPanel.css';
import MiddlePanel from 'C:/Users/jimenez.el/Desktop/Project Library/static_library_frontend/src/components/Middle Panel/middlePanel.jsx';
//import MiddlePanel from '/media/sf_Project_Library/static_library_frontend/src/components/Middle Panel/middlePanel.jsx';



function LeftPanel({ callbackAddFunction }) {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]); // Initialize an empty array to store selected files
  const [cFiles, setCFiles] = useState([]); // Initialize an array to store C files   
  const [inputValue, setInputValue] = useState('');
  const [selectedFunctions, setSelectedFunctions] = useState([]);
  const [rightPanelFunctions, setRightPanelFunctions] = useState([]);
  const [isAddButtonClicked, setIsAddButtonClicked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);


  const handleButtonClick = () => {
    // Trigger the file input click event
    fileInputRef.current.click();
  };

  useEffect(() => {
    console.log('Rendering Tab component...');
    try {
      // Retrieve data from local storage
      const savedSelectedFiles = JSON.parse(localStorage.getItem('selectedFiles')) || [];
      const savedCFiles = JSON.parse(localStorage.getItem('cFiles')) || [];
      const savedLibraryName = localStorage.getItem('libraryName') || '';

      // Convert plain objects back to File objects
      const selectedFiles = savedSelectedFiles.map(fileData => new File([fileData.content], fileData.name, { type: fileData.type, lastModified: fileData.lastModified }));
      const cFiles = savedCFiles.map(cFile => ({
        file: new File([cFile.file.content], cFile.file.name, { type: cFile.file.type, lastModified: cFile.file.lastModified }),
        functions: cFile.functions,
      }));

      console.log('Saved Library Name:', savedLibraryName);
      console.log('Retrieved from local storage:', { selectedFiles, cFiles, savedLibraryName });

      // Set the initial state
      setSelectedFiles(selectedFiles);
      setCFiles(cFiles);
      setInputValue(savedLibraryName);

      console.log('State after setting:', { selectedFiles, cFiles, inputValue });

    } catch (error) {
      console.error('Error retrieving data from local storage:', error);
    }
    // eslint-disable-next-line
  }, []);

  // Use useEffect to update local storage whenever selectedFiles, cFiles, or inputValue changes
  useEffect(() => {

    // Convert File objects to plain objects before storing in local storage
    const plainSelectedFiles = selectedFiles.map(file => ({
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      content: file.name, // Store content separately if needed
    }));

    const plainCFiles = cFiles.map(cFile => ({
      file: {
        name: cFile.file.name,
        type: cFile.file.type,
        lastModified: cFile.file.lastModified,
        content: cFile.file.name, // Store content separately if needed
      },
      functions: cFile.functions,
    }));

    localStorage.setItem('selectedFiles', JSON.stringify(plainSelectedFiles));
    localStorage.setItem('cFiles', JSON.stringify(plainCFiles));
    localStorage.setItem('libraryName', inputValue);

    console.log('Saved to local storage:', {
      plainSelectedFiles,
      plainCFiles,
      inputValue,
      localStorageSelectedFiles: localStorage.getItem('selectedFiles'),
      localStorageCFiles: localStorage.getItem('cFiles'),
      localStorageLibraryName: localStorage.getItem('libraryName'),
    });
  }, [selectedFiles, cFiles, inputValue]);


  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log('Selected File:', selectedFile);

      // Fetch file content
      const fileContent = await selectedFile.text();
      console.log('File Content:', fileContent);

      // Create a Blob and explicitly set the name property
      const blob = new Blob([fileContent], { type: selectedFile.type });
      console.log('Blob:', blob);

      // Explicitly set the name property when creating the File object
      const namedFile = new File([blob], selectedFile.name, { type: selectedFile.type, lastModified: selectedFile.lastModified });
      console.log('Named File:', namedFile);

      const formData = new FormData();
      formData.append('fileContent', fileContent);

      // Send a POST request to the Flask server
      const response = await fetch('http://localhost:5000/extract-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileContent }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Extracted functions:', data.functions);

        // Log the selected file and its name
        console.log('Selected File after fetch:', namedFile);
        console.log('Selected File Name:', namedFile.name);

        // Update the state with the selected and extracted files
        setSelectedFiles([...selectedFiles, namedFile]);
        setCFiles([...cFiles, { file: namedFile, functions: data.functions.map(func => func.trim()) }]);

        // Save the data to local storage
        try {
          const updatedSelectedFiles = [...selectedFiles, namedFile];
          const updatedCFiles = [...cFiles, { file: namedFile, functions: data.functions.map(func => func.trim()) }];

          localStorage.setItem('selectedFiles', JSON.stringify(updatedSelectedFiles));
          localStorage.setItem('cFiles', JSON.stringify(updatedCFiles));
        } catch (error) {
          console.error('Error checking storage space:', error);
        }
      } else {
        console.error('Failed to extract functions');
      }
    }
  };


  const handleRemoveCFile = (file) => {
    // Remove the C file from the array of C files
    const updatedCFiles = cFiles.filter((cFile) => cFile.file.name !== file.file.name);
    setCFiles(updatedCFiles);


    // Remove the selected file from the array of selected files
    const updatedSelectedFiles = selectedFiles.filter(
      (selectedFile) => selectedFile.name !== file.name
    );
    setSelectedFiles(updatedSelectedFiles);
  };


  const [toggleState, setToggleState] = useState(1);

  const toggleTab = (index) => {
    setToggleState(index);
  }


  const handleSelectFunction = (func) => {
    const isSelected = selectedFunctions.includes(func);

    // Toggle the selection status
    if (isSelected) {
      // If already selected, remove it
      setSelectedFunctions(selectedFunctions.filter((selectedFunc) => selectedFunc !== func));
    } else {
      // If not selected, add it
      setSelectedFunctions([...selectedFunctions, func]);
    }
  };

  const handleAddFunction = () => {
    if (selectedFunctions && selectedFunctions.length > 0) {
      // Update the state of the right panel with the selected functions
      setRightPanelFunctions([...rightPanelFunctions, ...selectedFunctions]);
      // Clear the selected functions after adding them to the right panel
      setSelectedFunctions([]);
      // Set the state to indicate the "ADD" button is clicked
      setIsAddButtonClicked(true);
    } else {
      alert("No functions selected");
    }
  };

  const handleAddAllFunctions = () => {
    // Extract all functions from cFiles
    const allFunctions = cFiles.reduce((acc, cFile) => [...acc, ...cFile.functions], []);

    // Update the state of the right panel with all functions
    setRightPanelFunctions([...rightPanelFunctions, ...allFunctions]);

    // Set the state to indicate the "ADD" button is clicked
    setIsAddButtonClicked(true);

    // Clear the selected functions after adding them to the right panel
    setSelectedFunctions([]);
  };

  const handleAddToRightPanel = () => {
    // Update the state of the right panel with the selected functions
    setRightPanelFunctions([...rightPanelFunctions, ...selectedFunctions]);
    // Clear the selected functions after adding them to the right panel
    setSelectedFunctions([]);
  };

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);

    // Calculate match count only if the search term is not empty
    if (newSearchTerm.trim() !== '') {
      const filteredFunctions = cFiles.reduce((acc, cFile) => {
        const matchingFunctions = cFile.functions.filter((func) => func.toLowerCase().includes(newSearchTerm.toLowerCase()));
        return acc.concat(matchingFunctions);
      }, []);

      const uniqueFunctions = Array.from(new Set(filteredFunctions));
      setMatchCount(uniqueFunctions.length);
    } else {
      // Hide the match count when the search term is empty
      setMatchCount(0);
    }
  };


  // Define escapeRegExp function
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  };

  const highlightSearchTerm = (text) => {
    if (searchTerm === '') {
      return text;
    }

    // Split the search term into words
    const searchWords = searchTerm.split(/\s+/).filter(Boolean);

    // Create a regex pattern for each word
    const regexPatterns = searchWords.map((word) => `(${escapeRegExp(word)})`);

    // Create a regex with OR conditions for each word
    const regex = new RegExp(regexPatterns.join('|'), 'gi');

    return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
  };

  return (

    <div className='container'>
      <div className='bloc-tabs'>
        <div className={toggleState === 1 ? "tabs active-tabs" : "tabs"} onClick={() => toggleTab(1)} id='library-tab'>
          <span>Library</span>
        </div> {/* () => toggleTab(1) This means that an anonymous function is calling the toggleTab function with an index of 1 */}
        <div className={toggleState === 2 ? "tabs active-tabs" : "tabs"} onClick={() => toggleTab(2)}>C Files</div>
      </div>

      {/*This is for the content of the tab */}
      <div className='content-tabs'>
        <div className={toggleState === 1 ? "content active-content" : "content"}>
          {/*This is for the rendering of the other component */}
          <div className="left-panel" id="left-panel">
            <input
              className="search-box"
              id='search-box'
              type="text"
              placeholder='BROWSE '
              value={searchTerm}
              onChange={handleSearchChange}
              autoComplete="off"
            ></input>
            <button className='search-button' onClick={handleButtonClick}>Open File</button>
            {searchTerm.trim() !== '' && (
              <div className="match-notification">{`${matchCount} matches found`}</div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div className="function-list-left-panel" id='function-list-left-panel'>
              {/* Display the extracted functions for each C file in function-list-left-panel */}
              {cFiles.map((cFile, index) => (
                <div key={index} className="c-file-functions">
                  {/* Display each extracted function with checkboxes */}
                  {cFile.functions.map((func, funcIndex) => (
                    <div key={funcIndex} className="extracted-function">
                      <input
                        type="checkbox"
                        className='checkbox'
                        id={`funcCheckbox-${funcIndex}`}
                        checked={selectedFunctions.includes(func)}
                        onChange={() => handleSelectFunction(func)}
                      />
                      <label
                        htmlFor={`funcCheckbox-${funcIndex}`}
                        dangerouslySetInnerHTML={{ __html: highlightSearchTerm(func.trim().replace(/^(\w+\s+\w+\s*\([^)]*\))\s*{/, '$1')) }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={toggleState === 2 ? "content active-content" : "content"}>
          <div className='c-files'></div>

          <div className='SecondTab'>
            {cFiles.map((cFile, index) => (
              <div key={index} className="file-item">
                <p className='files'>{cFile.file.name}</p>
                {/* Add any additional information or actions for the selected file */}
                <button className='remove-file' onClick={() => handleRemoveCFile(cFile)}>X</button>
              </div>
            ))}

          </div>
        </div>
      </div>
      <MiddlePanel
        selectedFunctions={selectedFunctions}
        setMovedFunctions={setSelectedFunctions}
        handleAddAllFunctions={handleAddAllFunctions}
        handleAddToRightPanel={handleAddToRightPanel}
        handleAddFunction={handleAddFunction}
        isAddButtonClicked={isAddButtonClicked}
        rightPanelFunctions={rightPanelFunctions}
        setRightPanelFunctions={setRightPanelFunctions}
      />
    </div>
  );
};

export default LeftPanel;
