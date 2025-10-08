import React, { createContext, useContext, useState, useReducer, useEffect, useRef } from "react";
import spiritsData from "./spirits.json"; // Adjust path if needed

// Importing element images
import airImg from "./assets/air.png";
import fireImg from "./assets/fire.png";
import waterImg from "./assets/water.png";
import earthImg from "./assets/earth.png";
import plantImg from "./assets/plant.png";
import animalImg from "./assets/animal.png";
import moonImg from "./assets/moon.png";
import sunImg from "./assets/sun.png";
import energyImg from "./assets/energy.png";

const loadedSpiritImages = import.meta.glob('./assets/spirits/*.png', {
  eager: true,
  import: 'default',
});

const spiritImages = Object.fromEntries(
  Object.entries(loadedSpiritImages).map(([path, src]) => {
    const fileName = path.split('/').pop().split('.').shift();
    return [fileName, src];
  })
);

// Element definitions
const elements = [
  { name: "Sun", image: sunImg },
  { name: "Moon", image: moonImg },
  { name: "Fire", image: fireImg },
  { name: "Air", image: airImg },
  { name: "Water", image: waterImg },
  { name: "Earth", image: earthImg },
  { name: "Plant", image: plantImg },
  { name: "Animal", image: animalImg },
  { name: "Energy", image: energyImg },
  { name: "Joker", image: "🃏" },
];

const newSprit = {
  panels: {
    spirit: true,
    elements: true,
    innates: true
  },
  selectedSpirit: null,
  elementCounts: elements.reduce((acc, el) => ({ ...acc, [el.name]: {temp: 0, persist: 0} }), {})
}

const SpiritContext = createContext();

// Format the Spirit Name into a class
function spiritClass(spiritName, includeAspect = false) {
  if (!spiritName) return '';
  const baseName = includeAspect ? spiritName : spiritName.split(' - ')[0];
  return baseName.toLowerCase().replaceAll(/\s|'/g, '-');
}

// Format the Spirit Name into a key for fetching img
function spiritImgKey(spiritName, includeAspect = false) {
  const baseName = includeAspect ? spiritName : spiritName.split(' - ')[0];
  return baseName.toLowerCase().replaceAll(/\s|'/g, '');
}

// Format the Spirit Name for display
function spiritDisplay(spiritName) { 
  return (
    <>
      {spiritName.split(' - ')[0]}
      {spiritName.split(' - ')[1] && <sup className="aspect">{spiritName.split(' - ')[1]}</sup>}
    </>
  )
}

const SpiritIslandTracker = () => {
  function spiritReducer(state, action) {
    switch (action.type) {

      case "TOGGLE_UI": {
        return {
          ...state,
          reducedUImode: !state.reducedUImode
        }
      }

      case "FOCUS_SPIRIT": {
        const { spiritIndex } = action.payload;

        return {
          ...state,
          visibleSpirit: spiritIndex
        }
      }

      case "ADD_SPIRIT": {
        return {
          ...state,
          spirits: [
            ...state.spirits,
            {...newSprit, id: crypto.randomUUID()}
          ]
        }
      }
      
      case "REMOVE_SPIRIT": {
        const { id } = action.payload;
        var filteredSpirits;

        if (state.spirits.length > 1) {
          filteredSpirits = state.spirits.filter(spirit => spirit.id !== id)
        } else {
          filteredSpirits = state.spirits
        }

        return {
          ...state,
          visibleSpirit: Math.min(state.visibleSpirit, (filteredSpirits.length - 1)),
          spirits: filteredSpirits
        }
      }

      case "CHANGE_SPIRIT": {
        const { id, spiritName } = action.payload;

        return {
          ...state,
          spirits: state.spirits.map(spirit => 
            spirit.id === id ? {
              ...spirit,
              selectedSpirit: spiritName
            } : spirit
          )
        }
      }

      case "TOGGLE_PANELS": {
        const { id, panel, isOpen } = action.payload;

        return {
          ...state,
          spirits: state.spirits.map(spirit => 
            spirit.id === id ? {
              ...spirit,
              panels: {
                ...spirit.panels,
                [panel]: isOpen === undefined ? !spirit.panels[panel] : isOpen
              }
            } : spirit
          )
        }
      }

      case "ADJUST_ELEMENT": {
        const { id, element, type, delta } = action.payload;

        const otherType = type == 'temp' ? 'persist' : 'temp';
        const maxCount = element === "Energy" ? 20 : 9;

        return {
          ...state,
          spirits: state.spirits.map(spirit =>
            spirit.id === id ? {
              ...spirit,
              elementCounts: {
                ...spirit.elementCounts,
                [element]: {
                  [type]: Math.min(Math.max(0, spirit.elementCounts[element][type] + delta), (maxCount - spirit.elementCounts[element][otherType])),
                  [otherType]: spirit.elementCounts[element][otherType]
                }
              }
            } : spirit
          )
        }
      }

      case "RESET_ELEMENTS": {
        const { id } = action.payload;

        return {
          ...state,
          spirits: state.spirits.map(spirit => 
            spirit.id === id ? {
              ...spirit,
              elementCounts: Object.fromEntries(
                Object.entries(spirit.elementCounts).map(([element, value]) => [
                  element,
                  { ...value, temp: 0 }
                ])
              )
            } : spirit
          )
        }
      }
      
      default:
        return state;
    }
  }

  const savedData = JSON.parse(localStorage.getItem("spiritsData"));

  let gameState;

  if (Array.isArray(savedData)) {
    // Old schema → migrate
    gameState = {
      spirits: savedData,
      visibleSpirit: 0,
      reducedUImode: false
    };
  } else if (savedData) {
    // Already in new schema
    gameState = {
      visibleSpirit: 0,
      reducedUImode: false,
      ...savedData,
      spirits: savedData.spirits || [
        {...newSprit, id: crypto.randomUUID()}
      ]
    };
  } else {
    // Nothing saved → start fresh
    gameState = {
      visibleSpirit: 0,
      reducedUImode: false,
      spirits: [
        {...newSprit, id: crypto.randomUUID()}
      ]
    };
  }

  const [gameData, dispatch] = useReducer(spiritReducer, gameState);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    localStorage.setItem("spiritsData", JSON.stringify(gameData));
  }, [gameData]);

  return (
    <>
      <div className={`spirits ${gameData.reducedUImode && "reduce-ui"}`}>
        <SpiritContext.Provider value={{dispatch, reducedUImode: gameData.reducedUImode}}>
          {
            gameData.reducedUImode ? (
              <>
                <div className={`spirit-thumbnails ${gameData.spirits.length === 1 && 'only-spirit'}`}>
                  {gameData.spirits.map((spirit, index) => <SpiritThumb key={spirit.id} spiritIndex={index} spirit={spirit} />)}
                  {gameData.spirits.length < 6 && 
                    <div className="add-spirit thumb" key="add-spirit-card" onClick={() => dispatch({ type: "ADD_SPIRIT" })}>
                      <div className="plus-button"></div>
                    </div>
                  }
                </div>
                
                <SpiritTracker spiritId={gameData.spirits[gameData.visibleSpirit].id} spirit={gameData.spirits[gameData.visibleSpirit]} />
              </>
            ) : (
              <>
                {gameData.spirits.map(spirit => <SpiritTracker key={spirit.id} spiritId={spirit.id} spirit={spirit} />)}
                {gameData.spirits.length < 6 && (
                  <div className="add-spirit" key="add-spirit-card" onClick={() => dispatch({ type: "ADD_SPIRIT" })}>
                    <div className="plus-button"></div>
                  </div>
                )}
              </>
            )
          }
          {}
        </SpiritContext.Provider>
      </div>
      <div className="settings">
        Enable reduced UI mode <span className="info" onClick={() => setShowInfo(!showInfo)}>ⓘ</span>:
        <span className={`switch ${gameData.reducedUImode ? "on" : "off"}`} onClick={() => dispatch({ type: "TOGGLE_UI" })}></span>
      </div>
      {showInfo && 
        <div class="info-text">
          Intended to reduce the UI for easy use on mobile portrait:
          <ul>
            <li>
              Most buttons are removed
            </li>
            <li>
              Tap the element icon to increment an element's single-turn element count
            </li>
            <li>
              Tap the button below an element to increment the element's persistant count (i.e. an element from your presence tracks)
            </li>
            <li>
              Long press an element or persistant-element-button to reset it to 0.
            </li>
            <li>
              The Reset button will set all counts to 0 except for your persistant elements
            </li>
            <li>
              Only see one Spirit at a time; switch between them with the thumbnails at the top
            </li>
          </ul>
        </div>
      }
    </>
  )
}

const SpiritThumb = ({spiritIndex, spirit}) => {
  const { dispatch } = useContext(SpiritContext);

  return (
    <span className={`thumb ${spiritClass(spirit.selectedSpirit)}`} onClick={() => dispatch({ type: "FOCUS_SPIRIT", payload: {spiritIndex: spiritIndex} })}>
      {spirit.selectedSpirit ? (
        <img src={spiritImages[spiritImgKey(spirit.selectedSpirit)]} />
      ) : (
        <span>?</span>
      )}
    </span>
  )
}

const SpiritTracker = ({spiritId, spirit}) => {
  const { dispatch } = useContext(SpiritContext);

  const counts = spirit.elementCounts;

  // toggles for hide/unhide information
  const {
    spirit: spiritOpen,
    elements: elementsOpen,
    innates: innatesOpen
  } = spirit.panels;

  const { selectedSpirit } = spirit;

  return (
    <div test={spiritId} className={`spirit ${spiritClass(selectedSpirit)} ${spiritOpen ? 'open' : 'closed'}`} onClick={() => dispatch({ type: "TOGGLE_PANELS", payload: {id: spiritId, panel: 'spirit', isOpen: true} })}>
      <div className="spirit-toggle" onClick={(e) => {e.stopPropagation(); dispatch({ type: "TOGGLE_PANELS", payload: {id: spiritId, panel: 'spirit'} })}}></div>
      <div className="spirit-remove" onClick={() => dispatch({ type: "REMOVE_SPIRIT", payload: { id: spiritId } })}></div>

      <div className="global-controls">
        <SpiritSelector spirit={spirit} />
      </div>

      <h4 className={elementsOpen ? 'open' : 'closed'} onClick={() => dispatch({ type: "TOGGLE_PANELS", payload: {id: spiritId, panel: 'elements'} })}>Elements</h4>
      <div className="elements">
        {elements.map((el) => (
            <Element key={el.name} spiritId={spiritId} el={el} counts={counts} />
        ))}
        <ResetButton spiritId={spiritId} />
      </div>
      {selectedSpirit && (
        <>
          <h4 className={innatesOpen ? 'open' : 'closed'} onClick={() => dispatch({ type: "TOGGLE_PANELS", payload: {id: spiritId, panel: 'innates'} })}>Innates</h4>
          <div className="innate-requirements">
            {spiritsData[selectedSpirit].map((innate, index) => (
              <Innate innate={innate} counts={counts} index={index} key={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Innate = ({ innate, counts, index }) => {

  function isThresholdADefinedElement(elem) {
    return elements.some(
      (e) => e.name === elem.Element
    );
  }
  
  return (
    <div
      className="innate-power"
    >
      <h6>{innate.Innate}</h6>
      {innate.Thresholds.map((threshold, thresholdIndex) => {

        const [totalThreshold, totalApplicableElements] = threshold.Elements.reduce((totalElements, thresholdElement) => {
          const elementKey = isThresholdADefinedElement(thresholdElement) ? thresholdElement.Element : "Joker";
          const elementTotal = counts[elementKey].temp + counts[elementKey].persist;
          return [
            totalElements[0] + thresholdElement.Quantity,
            totalElements[1] + Math.min(elementTotal, thresholdElement.Quantity)
          ]
        }, [0, 0]);

        const linePercentage = (totalApplicableElements / totalThreshold) * 100;

        return (
          <div
            className={`threshold-line ${linePercentage >= 100 ? "met" : "unmet"} ${linePercentage === 0 && "empty"}`}
            style={{"--line-percentage": `${linePercentage}%`}}
            key={thresholdIndex}
          >
            {threshold.Elements.map((elem, elemIndex) => {
              // Use "Joker" for unknown element requirements.
              const elementKey = isThresholdADefinedElement(elem) ? elem.Element : "Joker";
              const elementTotal = counts[elementKey].temp + counts[elementKey].persist
              const requirementPercentage = (elementTotal / elem.Quantity) * 100;

              return (
                <div
                  className={`threshold-element ${requirementPercentage >= 100 ? "met" : "unmet"} ${elementKey.toLowerCase()}`}
                  style={{"--percentage": `${requirementPercentage}%`}}
                  key={elemIndex}
                >
                  {isThresholdADefinedElement(elem) ? (
                    <img
                      src={
                        elements.find(
                          (el) => el.name === elem.Element
                        )?.image
                      }
                      alt={elem.Element}
                    />
                  ) : (
                    <span>🃏</span>
                  )}
                  <div>
                    {elem.Quantity}
                  </div>
                </div>
              );
            })}
          </div>
        )
      })}
    </div>
  )
}

const SpiritSelector = ({spirit}) => {
  const {dispatch} = useContext(SpiritContext);
  const { selectedSpirit } = spirit;

  var [open, setOpen] = useState(false);

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(!open);
    document.addEventListener('click', function removeOpen() {
      document.removeEventListener('click', removeOpen);
      setOpen(false);
    });
  }

  const handleSpiritChange = (event) => {
    const { dataset } = event.currentTarget;
    console.log(event.currentTarget, dataset);
    const spiritName = dataset.spiritName;
    dispatch({ type: "CHANGE_SPIRIT", payload: { id: spirit.id, spiritName: spiritName } });
  };

  return (
    <div className="spirit-selector">
      {selectedSpirit ? (
        <h2 onClick={handleOpen}>
          <img src={spiritImages[spiritImgKey(selectedSpirit)]} />
          <span>{spiritDisplay(selectedSpirit)}</span>
        </h2>
      ) : (
        <h2 onClick={handleOpen}>Select a Spirit</h2>
      )}
      <div className={`spirit-list ${open && 'open'}`}>
        {Object.keys(spiritsData)
          .sort()
          .map((spiritName, index) => (
            <div onClick={handleSpiritChange} className={`spirit-name ${spiritClass(spiritName)}`} key={`${spiritName}-${index}`} data-spirit-name={spiritName}>
              <img src={spiritImages[spiritImgKey(spiritName)]} />
              <span>{spiritDisplay(spiritName)}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

const ResetButton = ({ spiritId }) => {
  const { dispatch } = useContext(SpiritContext);

  return (
    <button
      onClick={() => dispatch({ type: 'RESET_ELEMENTS', payload: { id: spiritId }})}
      className="reset-button"
    >
      Reset
    </button>
  )
}

const Element = ({ spiritId, el, counts }) => {
  const { dispatch, reducedUImode } = useContext(SpiritContext);

  const timerRef = useRef(null);
  const LONG_PRESS_MS = 600;

  const handleDown = (params) => {
    timerRef.current = setTimeout(() => {
      dispatch(params);
      timerRef.current = null;
    }, LONG_PRESS_MS);
  };

  const handleUp = (params) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      dispatch(params);
      timerRef.current = null;
    }
  };

  const tempResetParams = {type: 'ADJUST_ELEMENT', payload: {id: spiritId, element: el.name, type: "temp", delta: counts[el.name].temp * -1}}
  const tempIncrParams = {type: 'ADJUST_ELEMENT', payload: {id: spiritId, element: el.name, type: "temp", delta: 1}}

  return (
    <div className={`element ${el.name.toLowerCase()}`} key={el.name} style={{ textAlign: "center" }}>
      <div 
        className="element-info"
        {...(
          reducedUImode ? {
            onPointerDown: () => handleDown(tempResetParams),
            onPointerUp: () => handleUp(tempIncrParams),
            onPointerCancel: () => clearTimeout(timerRef.current),
            onContextMenu: () => dispatch(tempResetParams)
          } : {
            onClick: () => dispatch(tempIncrParams)
          }
        )}
      >
        {el.name === "Joker" ? (
          <div className="joker">
            {el.image}
          </div>
        ) : (
          <img
            src={el.image}
            alt={el.name}
          />
        )}
        {(el.name !== "Joker" && el.name !== "Energy" && counts[el.name].persist > 0) && <div className="persist-count">{counts[el.name].persist}</div>}
        <div className="total-count">{counts[el.name].temp + counts[el.name].persist}</div>
      </div>
      <Incrementor el={el} type="temp" current={counts[el.name].temp} spiritId={spiritId} />
      {((el.name !== "Joker" && el.name !== "Energy") ) && <Incrementor el={el} type="persist" current={counts[el.name].persist} spiritId={spiritId} />}
    </div>
  )
}

const Incrementor = ({ el, type, spiritId, current }) => {
  const { dispatch, reducedUImode } = useContext(SpiritContext);

  const resetParams = {type: 'ADJUST_ELEMENT', payload: {id: spiritId, element: el.name, type: type, delta: current * -1}}
  const incrParams = {type: 'ADJUST_ELEMENT', payload: {id: spiritId, element: el.name, type: type, delta: 1}}

  const timerRef = useRef(null);
  const LONG_PRESS_MS = 600;

  const handleDown = (params) => {
    timerRef.current = setTimeout(() => {
      dispatch(params);
      timerRef.current = null;
    }, LONG_PRESS_MS);
  };

  const handleUp = (params) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      dispatch(params);
      timerRef.current = null;
    }
  };

  return (
    <div className={`incrementors ${type}`}>
      <button 
        {...(
          reducedUImode ? {
            onPointerDown: (e) => {handleDown(resetParams)},
            onPointerUp: () => handleUp(incrParams),
            onPointerCancel: () => clearTimeout(timerRef.current),
            onContextMenu: (e) => {e.preventDefault(); dispatch(resetParams)}
          } : {
            onClick: () => dispatch(incrParams)
          }
        )}
      >
        <span>+</span>
      </button>
      <button onClick={() => dispatch({type: 'ADJUST_ELEMENT', payload: {id: spiritId, element: el.name, type: type, delta: -1}})}><span>-</span></button>
    </div>
  )
}

export default SpiritIslandTracker;
