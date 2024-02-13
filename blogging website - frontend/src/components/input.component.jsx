import React, { useState } from "react";

const InputBox = ({ name, type, id, value, placeholder, icon , disable = false }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <div className="relative w-[100%] mb-4 ">
      <input
        type={
          type == "password" ? (passwordVisible ? "text" : "password") : type
        }
        name={name}
        placeholder={placeholder}
        defaultValue={value}
        id={id}
        disabled = {disable}
        className="input-box "
      />
      <i className={icon + " input-icon"}></i>

      {type == "password" ? (
        <i
          onClick={() => {
            setPasswordVisible((currvalue) => !currvalue);
          }}
          className={
            "fa-solid fa-eye" +
            (passwordVisible ? "-slash" : "") +
            " input-icon left-[auto] right-4 cursor-pointer"
          }
        ></i>
      ) : (
        ""
      )}
    </div>
  );
};

export default InputBox;
