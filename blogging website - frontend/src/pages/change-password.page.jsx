

import React, { useContext, useRef } from 'react'
import AnimationWrapper from '../common/page-animation'
import InputBox from '../components/input.component'
import toast from 'react-hot-toast';
import { logOutUser } from '../common/session';
import axios from 'axios';
import { UserContext } from '../App';

const ChangePassWord = () => {

    let { userAuth: { access_token } } = useContext(UserContext)

    let ChangePasswordForm = useRef();

    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;


    const handleSubmit = (e) => {
        e.preventDefault();

        let form = new FormData(ChangePasswordForm.current);

        let formData = {};
        for (let [key, value] of form.entries()) {
            formData[key] = value
        }

        let { currentPassword, newPassword } = formData;

        if (!currentPassword.length || !newPassword.length) {
            return toast.error("please provide the password")
        }


        if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
            return toast.error("Password shoild be 6 - 20 character long with one numeric, 1 lowercase and 1 uppercase letters ")
        }

        e.target.setAttribute('disabled', true)

        let loadingToast = toast.loading('updating.....')

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/change-password', formData, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then((data) => {

                toast.dismiss(loadingToast)
                e.target.setAttribute('disabled', false)
                return toast.success(data.data.message)
                
            })
            .catch((data) => {
                toast.dismiss(loadingToast)
                e.target.setAttribute('disabled', false)
                return toast.success(data.response.data.error)
            })


    }

    return (
        <div>
            <AnimationWrapper>
                <form ref={ChangePasswordForm}>

                    <h1>
                        <h1 className='max-md:hidden'>Change Password</h1>

                        <div className='py-10 w-full md:max-w-[400px] '>
                            <InputBox icon={"fa-solid fa-unlock"} name={"currentPassword"} type={"password"} className="profile-edit-input" placeholder={"current Password"} />
                            <InputBox icon={"fa-solid fa-unlock"} name={"newPassword"} type={"password"} className="profile-edit-input" placeholder={"New Password"} />

                            <button className='btn-dark px-10' type='submit' onClick={handleSubmit}>Change Password</button>
                        </div>
                    </h1>

                </form>
            </AnimationWrapper>

        </div>
    )
}

export default ChangePassWord
