// Modal.js
import React from 'react';
import './summaryFunction.css';
import { generateLibraryURL } from './api'; // Adjust the path as needed


const Modal = ({ isOpen, onClose, libraryName, libraryType, confirmModal, userInputs, selectedOption, setIsDownloadReady, movedFunctions, rightPanelFunctions }) => {

  if (!isOpen) return null;

  const handleConfirm = async () => {
    onClose(); // Close the modal
    confirmModal();


    const requestData = {
      libraryName: libraryName,
      userInputs: userInputs,
      rightPanelFunctions: rightPanelFunctions,
      libraryType: selectedOption, // Add library type to the request 
    };

    try {
      const response = await fetch(generateLibraryURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      //const data = await response.json();
      // alert(data.message);
      // If the library was generated successfully, enable the download
      if (response.ok) {
        setIsDownloadReady(true);
      }
    } catch (error) {
      console.error('Error creating library(FrontEnd):', error);
    }

  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className='info'>
          <h2 className='header'>Summary</h2>
          {/*This is for the name */}
          {libraryType === 'Static' ? (
            <div className='name'><i>Name:</i>lib{libraryName}.a</div>
          ) : (
            <div className='name'><i>Name:</i>lib{libraryName}.so</div>
          )}

          <div className='library'><i>Library:</i>{libraryType}</div>
        </div>
        <div className='list'>
          {userInputs.map((input, index) => (
            <div key={index} className='input-item'>
              {input}
            </div>
          ))}

          {rightPanelFunctions.map((input, index) => (
            <div key={index} className='input-item'>
              {input}
            </div>
          ))}
        </div>
        <button className='cancelBtn' onClick={onClose}>Cancel</button>
        <button className='confirmBtn' onClick={handleConfirm}>Confirm</button>

      </div>
    </div>
  );
};

export default Modal;
