// MiddlePanel.jsx
import React from 'react';
import './middlepanel.css';
import RightPanel from '../Right Panel/rightPanel';
const MiddlePanel = ({ rightPanelFunctions, selectedFunctions, handleAddToRightPanel, setMovedFunctions, setRightPanelFunctions, handleAddFunction, handleAddAllFunctions, isAddButtonClicked }) => {
 
  return (
    <div>
      <div className='button-container'>
        <button className="add-button" onClick={handleAddFunction}>
          ADD
        </button>
        <button className="add-all-button" onClick={handleAddAllFunctions}>
          ADD ALL
        </button>
      </div>
      <RightPanel
        movedFunctions={selectedFunctions} // Pass the extracted functions to the RightPanel
        setMovedFunctions ={setMovedFunctions}
        handleAddToRightPanel ={handleAddToRightPanel}
        handleAddFunction = {handleAddFunction}
        isAddButtonClicked = {isAddButtonClicked}
        rightPanelFunctions = {rightPanelFunctions}
        setRightPanelFunctions ={setRightPanelFunctions}
      />
    </div>
  );
};

export default MiddlePanel;
