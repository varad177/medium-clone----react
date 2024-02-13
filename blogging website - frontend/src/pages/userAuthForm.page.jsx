import React, { useContext, useEffect } from "react";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import { Link, Navigate, unstable_useViewTransitionState } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";
const UserAuthForm = ({ type }) => {

  let {
    userAuth ,
    setUserAuth
  } = useContext(UserContext);

  useEffect(() => {
    const fetchData = async() =>{
     await storingData();

    }

    fetchData()

  }, []);

  const storingData = async () => {
    try {
      let userInSession = await sessionStorage.getItem("user");

      if (userInSession) {
        setUserAuth(JSON.parse(userInSession));
      } else {
        setUserAuth({ access_token: null });
      }
    } catch (error) {
      console.log(error.message);
    }
  };




  const userAuthThroughServer = (serverRoute, formdata) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formdata)
      .then(({ data }) => {
        console.log(data);
        setUserAuth(data)

        storeInSession("user", JSON.stringify(data));
        console.log(sessionStorage);
      })
      .catch(({ response }) => {
        toast.error(response.data.error);
      });
  };

  const handlesubmit = (e) => {
    e.preventDefault();

    let serverRoute = type == "sign-in" ? "/signin" : "/signup";
    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    // form data
    let form = new FormData(formElement);

    console.log(form);
    let formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    console.log(formData);

    const { fullname, email, password } = formData;

    //validatingf data
    if (fullname) {
      if (fullname.length < 3) {
        return toast.error("Name must be at least three characters long");
      }
    }

    if (!email.length) {
      return toast.error("Email is required");
    }

    if (!emailRegex.test(email)) {
      return toast.error("Email is invalid ");
    }

    if (!passwordRegex.test(password)) {
      return toast.error(
        "password should be 6 to 20 character long with a numeric , 1 lowercase and 1 uppercase letter"
      );
    }

    userAuthThroughServer(serverRoute, formData);
  };


  const handleGoogleAuth = (e)=>{
    e.preventDefault();
    authWithGoogle().then((user)=>{
      let serverRoute = "/google-auth";

      let formData = {
        access_token : user.accessToken
      }

      userAuthThroughServer(serverRoute , formData)


    })
    .catch(err=>{
        toast.error("trouble to login with google")
    })

  }

  return (

   userAuth &&  userAuth.access_token ?
    <Navigate to="/"/>
    :
    <AnimationWrapper key={type}>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <form id="formElement" action="" className="w-[80%] max-w-[400px]">
          <h1 className="text-center text-4xl font-gelasio capitalize mb-24">
            {type == "sign-in" ? "welcome back" : "join us today"}
          </h1>

          {type !== "sign-in" ? (
            <InputBox
              name="fullname"
              type="text"
              placeholder="fullname"
              icon="fa-solid fa-user"
            />
          ) : (
            ""
          )}

          <InputBox
            name="email"
            type="email"
            placeholder="email"
            icon="fa-solid fa-envelope"
          />

          <InputBox
            name="password"
            type="password"
            placeholder="password"
            icon="fa-solid fa-key"
          />

          <button
            onClick={handlesubmit}
            className="btn-dark center mt-14 "
            type="submit"
          >
            {type.replace("-", " ")}
          </button>

          <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold ">
            <hr className="w-1/2 " />
            <p>or</p>
            <hr className="w-1/2 " />
          </div>
          <button onClick={handleGoogleAuth} className="btn-dark flex gap-4 w-[90%] m-auto items-center justify-center ">
            <img className="w-5 " src={googleIcon} alt="" />
            Continue With Google
          </button>

          {type == "sign-in" ? (
            <p className="mt-6 text-dark-grey text-xl text-center">
              Don't Have a Account ?
              <Link className="underline text-black text-xl ml-1" to="/signup">
                Sign Up Here
              </Link>
            </p>
          ) : (
            <p className="mt-6 text-dark-grey text-xl text-center">
              Already a member ?
              <Link className="underline text-black text-xl ml-1" to="/signin">
                Sign In Here
              </Link>
            </p>
          )}
        </form>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm;
