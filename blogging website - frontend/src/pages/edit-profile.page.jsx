

import React, { useContext, useEffect, useRef, useState } from 'react'
import { UserContext } from '../App'
import axios from 'axios'
import { profileDataStructure } from './profile.page'
import AnimationWrapper from '../common/page-animation'
import Loader from '../components/loader.component'
import InputBox from '../components/input.component'
import toast from 'react-hot-toast'
import { uploadImage } from '../common/aws'
import { storeInSession } from '../common/session'

const EditProfile = () => {

    let editProfile = useRef()

    let bioLimit = 150
    const [characterLeft, setcharacterLeft] = useState(bioLimit)


    const [profile, setProfile] = useState(profileDataStructure)
    const [loading, setLoading] = useState(true)

    const [updatedProfileImg, setUpdatedProfileImg] = useState(null)

    let { personal_info: { fullname, username: profile_username, profile_img, email, bio }, social_links } = profile

    let { userAuth, userAuth: { access_token }, setUserAuth } = useContext(UserContext)


    useEffect(() => {
        if (access_token) {

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/get-profile', { username: userAuth.username }).then(({ data }) => {
                setProfile(data)
                setLoading(false)
            })
                .catch(err => {
                    console.log(err.message);
                })

        }




    }, [access_token])

    const handleCharacterChange = (e) => {
        setcharacterLeft(bioLimit - e.target.value.length)
    }

    const profileImgRef = useRef()

    const handleImagePreview = (e) => {

        let img = e.target.files[0];

        profileImgRef.current.src = URL.createObjectURL(img)
        setUpdatedProfileImg(img)
    }


    const handleImgUpload = (e) => {
        e.preventDefault();

        if (updatedProfileImg) {
            let loadingToast = toast.loading("uploading....")
            e.target.setAttribute('disabled', true);


            uploadImage(updatedProfileImg)
                .then(url => {
                    if (url) {
                        axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/update-profile-img', { url }, {
                            headers: {
                                'Authorization': `Bearer ${access_token}`
                            }
                        })
                            .then(({ data }) => {
                                let newUserAuth = { ...userAuth, profile_img: data.profile_img };
                                storeInSession("user", JSON.stringify(newUserAuth))
                                setUserAuth(newUserAuth)

                                setUpdatedProfileImg(null)
                                toast.dismiss(loadingToast);
                                e.target.removeAttribute('disabled')
                                toast.success("uploaded 👍")
                            })
                            .catch(({ response }) => {
                                toast.dismiss(loadingToast);
                                e.target.removeAttribute('disabled')
                                toast.error(response.data.error)

                            })
                    }
                })
                .catch(err => {
                    console.log(err.message);
                })
        }
    }


    const handleSubmit = (e) => {
        e.preventDefault();
        let form = new FormData(editProfile.current);


        let formData = {};

        for (let [key, value] of form.entries())

            formData[key] = value

        let { username, bio, youtube, facebook, twitter, github, instagram, website, } = formData

        if (username.length < 3) {
            return toast.error("username should be atleast 3 letter long")

        }

        if (bio.length > bioLimit) {
            return toast.error(`bio should be less than ${bioLimit} character`)
        }



        let foemloadingToast = toast.loading("Updating....");
        e.target.setAttribute('disabled', true);

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/update-profile', {
            username, bio, social_links: {
                youtube, facebook, twitter, github, instagram, website
            }
        }
            , { headers: { 'Authorization': `Bearer ${access_token}` } })
            .then(({ data }) => {
                if (userAuth.username != data.username) {
                    let newUserAuth = { ...userAuth, username: data.username }

                    storeInSession("user", JSON.stringify(newUserAuth))

                    setUserAuth(newUserAuth)
                }

                toast.dismiss(foemloadingToast)
                e.target.removeAttribute('disabled')
                toast.success("Profile Updated Successfully!")
            })
            .catch(({response})=>{
                
                toast.dismiss(foemloadingToast)
                e.target.removeAttribute('disabled')
                toast.error(response.data.error)
            })




    }

    return (
        <div>

            <AnimationWrapper>


                {
                    loading ? <Loader /> :
                        <form ref={editProfile}>

                            <h1 className='max-md:hidden '>Edit Profile</h1>

                            <div className='flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10'>
                                <div className="max-lg:center mb-5 ">
                                    <label htmlFor="uploadImg" id='profileImgLabed' className='relative block w-48 h-48 bg-grey rounded-full overflow-hidden'>

                                        <div className='w-full h-full  absolute top-0 left-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 cursor-pointer' >
                                            Upload Image
                                        </div>
                                        <img ref={profileImgRef} src={profile_img} alt="" />


                                    </label>
                                    <input onChange={handleImagePreview} type="file" id='uploadImg' accept='.jpeg, .png , .jpg' hidden />
                                    <button className='btn-light mt-5 max-lg:center lg:w-full px-10 ' onClick={handleImgUpload}>Upload</button>
                                </div>

                                <div className="w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5 ">

                                        <div>
                                            <InputBox value={fullname} name="fullname" type={"text"} placeholder={"fullname"} icon={"fa-regular fa-user"} disable="true" />
                                        </div>
                                        <div>
                                            <InputBox value={email} name="fullname" type={"email"} placeholder={"email"} icon={"fa-solid fa-envelope"} disable="true" />
                                        </div>
                                    </div>

                                    <InputBox type="text" name="username" icon={"fa-solid fa-at"} value={profile_username}
                                        placeholder={"username"} />

                                    <p className='text-dark-grey -mt-3'>Username will  use to search the user and will be visible to all user</p>

                                    <textarea name="bio" maxLength={bioLimit} defaultValue={bio} className='input-box h-64 lg:h-40 resize-none left-7 mt-5 pl-5 ' placeholder='bio' onChange={handleCharacterChange}></textarea>
                                    <p className='mt-1 text-dark-grey '>{characterLeft + " character left"}</p>
                                    <p className='my-6 text-dark-grey '>Add Your Social Handles Here </p>

                                    <div className="md:grid md:grid-cols-2 gap-x-6 ">
                                        {
                                            Object.keys(social_links).map((key, i) => {
                                                let link = social_links[key];
                                                return <InputBox
                                                    name={key}
                                                    key={i} type={"text"} value={link} placeholder={"https://"} icon={key == "website" ? "fa-solid fa-globe" : `fa-brands fa-${key}`} />

                                            })
                                        }
                                    </div>

                                    <button onClick={handleSubmit} className='btn-dark w-auto px-10 ' type='submit'>
                                        Update
                                    </button>


                                </div>

                            </div>


                        </form>
                }
            </AnimationWrapper>

        </div>
    )
}

export default EditProfile
