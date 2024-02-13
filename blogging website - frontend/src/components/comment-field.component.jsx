import React, { useContext, useState } from 'react'
import { UserContext } from '../App'
import toast from 'react-hot-toast'
import axios from 'axios'
import { BlogContext } from '../pages/blog.page'

const CommentField = ({ action, index = undefined, replyingTo = undefined, setIsReplying }) => {
    let { blog, setTotalParentCommentLoaded, totalParentCommentLoaded, setBlog, blog: { _id, activity, activity: { total_comments, total_parent_comments }, comments, comments: { results: commentsArr }, author: { _id: blog_author } } } = useContext(BlogContext)

    console.log(totalParentCommentLoaded);

    const [comment, setComment] = useState("")

    let { userAuth: { access_token, username, profile_img, fullname } } = useContext(UserContext)

    const handleComment = () => {
        if (!access_token) {
            toast.error("pleased login to leave comment")
        }
        if (!comment.length) {
            toast.error("write something to leave the comment")

        }

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/add-comment', {
            _id, blog_author, comment, replying_to: replyingTo
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        }).then(({ data }) => {

            setComment("")
            data.commented_by = {
                personal_info: {
                    username, profile_img, fullname
                }
            }


            let newCommentArr;


            if (replyingTo) {
                commentsArr[index].children.push(data._id)
                data.childrenLevel = commentsArr[index].childrenLevel + 1

                data.parentIndex = index

                commentsArr[index].isReplyLoaded = true;

                commentsArr.splice(index + 1 , 0 , data);
                newCommentArr = commentsArr

                setIsReplying(false)
            }
            else {
                data.childrenLevel = 0;
                newCommentArr = [data, ...commentsArr];
             
            }




            console.log("the new comment Arr is -> " , newCommentArr);

            let parentCommentIncrementVal = replyingTo ? 0 :  1;
            setBlog({ ...blog, comments: { ...comments, results: newCommentArr }, activity: { ...activity, total_comments: total_comments + 1, total_parent_comments: total_parent_comments + parentCommentIncrementVal } })
            console.log(blog);
            console.log(totalParentCommentLoaded);


            setTotalParentCommentLoaded(preval => preval + parentCommentIncrementVal)

            console.log(totalParentCommentLoaded);




        }).catch(err => {
            console.log(err);
        })

    }
    return (
        <>
            <textarea value={comment} placeholder='leave a comment' className='input-box text-dark-grey resize-noneh-[150px] overflow-auto' onChange={(e) => setComment(e.target.value)}></textarea>

            <button onClick={handleComment} className='btn-dark mt-5 px-10'>{action}</button>

        </>
    )
}

export default CommentField
