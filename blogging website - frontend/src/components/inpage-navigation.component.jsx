import React, { useEffect, useRef, useState } from "react";

export let activeTab;
export let activeTagLineTag;

const InpageNavigation = ({
  routes,
  defaultActiveindex = 0,
  defaultHidden = [],
  children
}) => {
  activeTagLineTag = useRef();
  activeTab = useRef();

  const [inPageNavIndex, setPageNavIndex] = useState(0);
  let [width, setWidth] = useState(window.innerWidth)
  let [isResizeEventAdded, setIsResizeEventAdded] = useState(false)


  useEffect(() => {

    if (width > 766 && InpageNavigation != defaultActiveindex) {

      changePageState(activeTab.current, defaultActiveindex);
    }


    if (!isResizeEventAdded) {
      window.addEventListener("resize", () => {
        if (!isResizeEventAdded) {
          setIsResizeEventAdded(true)
        }
        setWidth(window.innerWidth)
      })
    }
  }, [width]);

  console.log(width);

  const changePageState = (btn, i) => {
    let { offsetWidth, offsetLeft } = btn;
    console.log(offsetLeft, offsetWidth);

    activeTagLineTag.current.style.width = offsetWidth + "px";
    activeTagLineTag.current.style.left = offsetLeft + "px";
    setPageNavIndex(i);
  };

  return (
    <>
      <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto ">
        {routes.map((route, i) => {
          return (
            <button
              ref={i == defaultActiveindex ? activeTab : null}
              onClick={(e) => {
                changePageState(e.target, i);
              }}
              className={
                "p-4 px-5 capitalize " +
                (inPageNavIndex == i ? "text-black " : "text-dark-grey ") +
                (defaultHidden.includes(route) ? " md:hidden" : " ")
              }
            >
              {route}
            </button>
          );
        })}

        <hr className="absolute bottom-0 duration-300 border-dark-grey" ref={activeTagLineTag} />
      </div>
      {Array.isArray(children) ? children[inPageNavIndex] : children}
    </>
  );
};

export default InpageNavigation;
