import express, { json } from "express";
import mongoose from "mongoose";
import "dotenv/config";

import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import aws from "aws-sdk";

// import admin from "firebase-admin";
// import * as admin from 'firebase-admin';
import admin from "firebase-admin";
import { getAuth } from "firebase/auth";

// import serviceAccountKey from "./medium-clone-2b0eb-firebase-adminsdk-4m109-6a21350bd0.json" assert  {type : json};
import serviceAccountKey from "./medium-clone-2b0eb-firebase-adminsdk-4m109-6a21350bd0.json" assert { type: "json" };

//schema
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";

const server = express();

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

let PORT = 3000;

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccountKey),
// });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

//setting s3 buckets
const s3 = new aws.S3({
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRETE_KEY,
});

const generateUploadUrl = async () => {
  const date = new Date();

  const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

  return await s3.getSignedUrlPromise("putObject", {
    Bucket: "medium-blog-clone",
    Key: imageName,
    Expires: 1000,
    ContentType: "image/jpeg",
  });
};

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

//middle ware

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({
      error: "no access token",
    });
  }

  jwt.verify(token, process.env.SECRETE_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "access token invalid",
      });
    }

    req.user = user.id;
    req.admin = user.admin;
    next();
  });
};

const formatDataToSend = (user) => {
  const access_token = jwt.sign(
    {
      id: user._id,
      admin: user.admin,
    },
    process.env.SECRETE_KEY
  );

  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
    isAdmin: user.admin,
  };
};

const genereteUsername = async (email) => {
  let username = email.split("@")[0];

  let UsernameNotUnique = await User.exists({
    "personal_info.username": username,
  }).then((result) => result);

  UsernameNotUnique ? (username += nanoid().substring(0, 5)) : " ";

  return username;
};

//upload image url root

server.get("/get-upload-url", (req, res) => {
  generateUploadUrl()
    .then((url) => {
      return res.status(200).json({
        uploadUrl: url,
      });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/signup", (req, res) => {
  const { fullname, email, password } = req.body;
  console.log(fullname, email, password);
  //validatingf data
  if (fullname.length < 3) {
    return res.status(403).json({
      error: "Name must be at least three characters long",
    });
  }

  if (!email.length) {
    return res.status(403).json({ error: "Email is required" });
  }

  if (!emailRegex.test(email)) {
    return res.status(403).json({
      error: "Email is invalid ",
    });
  }

  if (!passwordRegex.test(password)) {
    return res.status(403).json({
      error:
        "password should be 6 to 20 character long with a numeric , 1 lowercase and 1 uppercase letter",
    });
  }

  bcrypt.hash(password, 10, async (err, hashpassword) => {
    let username = await genereteUsername(email);

    let user = new User({
      personal_info: { fullname, email, password: hashpassword, username },
    });

    user
      .save()
      .then((u) => {
        return res.status(200).json(formatDataToSend(u));
      })
      .catch((err) => {
        if (err.code == 11000) {
          return res.status(409).json({ error: "Email already exists" });
        }
        return res.status(400).json({
          error: err.message,
        });
      });
  });
});

server.post("/signin", (req, res) => {
  let { email, password } = req.body;

  User.findOne({ "personal_info.email": email })
    .then((user) => {
      console.log(user);
      if (!user) {
        return res
          .status(403)
          .json({ error: "user not found, kindly sign up " });
      }

      if (!user.google_auth) {
        bcrypt.compare(password, user.personal_info.password, (err, result) => {
          if (err) {
            return res.status(403).json({
              error: "something is wrong , please try later ",
            });
          }

          if (!result) {
            return res.status(403).json({
              error: "Incorrect password",
            });
          } else {
            return res.status(200).json(formatDataToSend(user));
          }
        });
      } else {
        return res.status(403).json({
          error: "account was created with google, try login with google",
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/google-auth", async (req, res) => {
  let { access_token } = req.body;

  admin
    .auth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
      let { email, name, picture } = decodedUser;
      picture = picture.replace("s96-c", "s384-c");
      let user = await User.findOne({ "personal_info.email": email })
        .select(
          "personal_info.fullname personal_info.username personal_info.profile_img google_auth admin"
        )
        .then((u) => {
          return u || null;
        })
        .catch((err) => {
          return res.status(500).json({
            error: err.message,
          });
        });

      if (user) {
        if (!user.google_auth) {
          return res.status(403).json({
            error:
              "this email was sign up with google. please log in with the password to access the account",
          });
        }
      } else {
        let username = await genereteUsername(email);
        user = new User({
          personal_info: {
            fullname: name,
            email,
            profile_img: picture,
            username,
          },
          google_auth: true,
        });

        await user
          .save()
          .then((u) => {
            user = u;
          })
          .catch((err) => {
            return res.status(500).json({
              error: err.message,
            });
          });
      }

      return res.status(200).json(formatDataToSend(user));
    })
    .catch((err) => {
      return res.status(500).json({
        error:
          "faild to authenticate with the google, try with some other google account",
      });
    });
});

server.post("/change-password", verifyJWT, (req, res) => {
  let { currentPassword, newPassword } = req.body;

  if (
    !passwordRegex.test(currentPassword) ||
    !passwordRegex.test(newPassword)
  ) {
    return res.status(403).json({
      error:
        "Password shoild be 6 - 20 character long with one numeric, 1 lowercase and 1 uppercase letters",
    });
  }

  User.findOne({ _id: req.user })
    .then((user) => {
      if (user.google_auth) {
        return res.status(403).json({
          error:
            "you cannot change the password, because you are logged in through google",
        });
      }

      bcrypt.compare(
        currentPassword,
        user.personal_info.password,
        (err, result) => {
          if (err) {
            return res.status(500).json({
              error:
                "some error while changing the password, pleased try again later",
            });
          }

          if (!result) {
            return res.status(403).json({
              error: "Current Password is incorrect!",
            });
          }

          bcrypt.hash(newPassword, 10, (err, hased_Password) => {
            User.findOneAndUpdate(
              { _id: req.user },
              { "personal_info.password": hased_Password }
            )
              .then((u) => {
                return res.status(200).json({
                  message: "password change sucessfully",
                });
              })
              .catch((err) => {
                return res.status(500).json({
                  error: "error while saving new password pleased try later",
                });
              });
          });
        }
      );
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({
        error: "user not found",
      });
    });
});

server.post("/create-blog", verifyJWT, (req, res) => {
  let authorId = req.user;
  let isAdmin = req.admin;

  if (!isAdmin) {
    return res.status(500).json({
      error: "you dont have permission to create the blog",
    });
  }
  let { title, banner, content, tags, des, draft, id } = req.body;

  if (!title.length) {
    return res.status(400).json({
      error: "please provide a blog title",
    });
  }

  if (!draft) {
    if (!des.length || des.length > 200) {
      return res.status(400).json({
        error: "You must provide blog description under 200 character",
      });
    }
    if (!banner.length) {
      return res.status(400).json({
        error: "you must provide banner to publish it",
      });
    }

    if (!content.blocks.length) {
      return res.status(400).json({
        error: "there must be blog content so [ublish",
      });
    }
    if (!tags.length || tags.length > 10) {
      return res.status(400).json({
        error: "provide tag to publish , maxmum 10",
      });
    }
  }

  tags = tags.map((tag) => tag.toLowerCase());

  let blog_id =
    id ||
    title
      .replace(/[^a-zA-z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim() + nanoid();

  // return console.log("title---"+title+ "banner---"+banner+ "content---"+content + "tags---"+tags+ "des---"+des+ "draft---"+draft+"id---"+id );

  if (id) {
    Blog.findOneAndUpdate(
      { blog_id },
      {
        title,
        des,
        banner,
        content,
        tags,
        draft: draft ? draft : false,
      }
    )
      .then(() => {
        return res.status(200).json({
          id: blog_id,
        });
      })
      .catch((err) => {
        return res.status(500).json({
          error: err.message,
        });
      });
  } else {
    let blog = new Blog({
      title,
      des,
      banner,
      content,
      tags,
      author: authorId,
      blog_id,
      draft: Boolean(draft),
    });

    blog
      .save()
      .then((blog) => {
        let incrementVal = draft ? 0 : 1;
        User.findOneAndUpdate(
          { _id: authorId },
          {
            $inc: {
              "account_info.total_posts": incrementVal,
            },
            $push: { blogs: blog._id },
          }
        )
          .then((user) => {
            return res.status(200).json({
              id: blog.blog_id,
            });
          })
          .catch((err) => {
            return res.status(500).json({
              error: "failed to update total post number",
            });
          });
      })
      .catch((err) => {
        return res.status(500).json({
          error: err.message,
        });
      });
  }
});

server.post("/latest-blog", (req, res) => {
  let { page } = req.body;
  let maxLimit = 5;
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id "
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title des banner activity tags publishedAt -_id ")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({
        blogs,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: err.message,
      });
    });
});

server.get("/trending-blog", (req, res) => {
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id "
    )
    .sort({
      "activity.total_reads": -1,
      "activity.total_likes": -1,
      publishedAt: -1,
    })
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then((blogs) => {
      return res.status(200).json({
        blogs,
      });
    })
    .catch((err) => {
      return res.status(403).json({
        error: err.message,
      });
    });
});

server.post("/search-blog", (req, res) => {
  let { tag, query, page, author, limit, eliminate_blog } = req.body;
  console.log(tag);
  let findQuery;

  let maxLimit = limit ? limit : 2;
  if (tag) {
    findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
  } else if (query) {
    findQuery = { title: new RegExp(query, "i"), draft: false };
  } else if (author) {
    findQuery = { author, draft: false };
  }

  Blog.find(findQuery)
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id "
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title des banner activity tags publishedAt -_id ")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({
        blogs,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: err.message,
      });
    });
});

server.post("/all-latest-blogs-count", (req, res) => {
  Blog.countDocuments({ draft: false })
    .then((count) => {
      return res.status(200).json({
        totalDocs: count,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/search-blogs-count", (req, res) => {
  let { tag, query, author } = req.body;
  console.log(author);
  let findQuery;

  if (tag) {
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    findQuery = { title: new RegExp(query, "i"), draft: false };
  } else if (author) {
    findQuery = { author, draft: false };
  }

  Blog.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({
        totalDocs: count,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: err.message,
      });
    });
});

server.post("/search-users", (req, res) => {
  let { query } = req.body;
  User.find({ "personal_info.username": new RegExp(query, "i") })
    .limit(50)
    .select(
      "personal_info.fullname personal_info.username personal_info.profile_img -_id "
    )
    .then((users) => {
      return res.status(200).json({
        users,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: err.message,
      });
    });
});

server.post("/get-profile", (req, res) => {
  let { username } = req.body;

  User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updateAt -blogs")
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/update-profile", verifyJWT, (req, res) => {
  let { username, bio, social_links } = req.body;

  console.log(username, bio, social_links);

  let biolimit = 150;

  if (username.length < 3) {
    return res.status(401).json({
      error: "username should be 3 letter long",
    });
  }

  if (bio.length > biolimit) {
    return res.status(401).json({
      error: `bio should not be more that ${biolimit}`,
    });
  }

  let socialLinksArr = Object.keys(social_links);

  try {
    for (let i = 0; i < socialLinksArr.length; i++) {
      if (social_links[socialLinksArr[i]].length) {
        let hostname = new URL(social_links[socialLinksArr[i]]).hostname;

        if (
          !hostname.includes(`${socialLinksArr[i]}.com`) &&
          socialLinksArr[i] != "website"
        ) {
          return res.status(403).json({
            error: `${socialLinksArr[i]} link is invalid you must provide the proper link`,
          });
        }
      }
    }
  } catch (error) {
    return res.status(500).json({
      error: "you must provide full social link with https:// included",
    });
  }

  let updateObj = {
    "personal_info.username": username,
    "personal_info.bio": bio,
    social_links,
  };

  User.findOneAndUpdate({ _id: req.user }, updateObj, {
    runValidators: true,
  })
    .then(() => {
      return res.status(200).json({
        username,
      });
    })
    .catch((err) => {
      if (err.code == 11000) {
        return res.status(500).json({
          error: "username name is already taken",
        });
      }

      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/update-profile-img", verifyJWT, (req, res) => {
  let { url } = req.body;

  User.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
    .then(() => {
      return res.status(200).json({
        profile_img: url,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/get-blog", (req, res) => {
  let { blog_id, draft, mode } = req.body;

  console.log(blog_id, draft, mode);
  let incrementVal = mode != "edit" ? 1 : 0;
  Blog.findOneAndUpdate(
    { blog_id },
    {
      $inc: {
        "activity.total_reads": incrementVal,
      },
    }
  )
    .populate(
      "author",
      "personal_info.fullname personal_info.username personal_info.profile_img "
    )
    .select("title des content banner activity publishedAt blog_id tags")
    .then((blog) => {
      User.findOneAndUpdate(
        { "personal_info.username": blog.author.personal_info.username },
        {
          $inc: {
            "account_info.total_reads": incrementVal,
          },
        }
      ).catch((err) => {
        return (
          res.status(500),
          json({
            error: err.message,
          })
        );
      });

      if (blog.draft && !draft) {
        return res.status(500).json({
          error: "you cannot access the draft blog ",
        });
      }

      return res.status(200).json({
        blog,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/like-blog", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id, isLikedByUser } = req.body;

  console.log(_id, isLikedByUser);

  let incrementVal = !isLikedByUser ? 1 : -1;

  Blog.findOneAndUpdate(
    { _id },
    {
      $inc: {
        "activity.total_likes": incrementVal,
      },
    }
  ).then((blog) => {
    if (!isLikedByUser) {
      let like = new Notification({
        type: "like",
        blog: _id,
        notification_for: blog.author,
        user: user_id,
      });

      like
        .save()
        .then((notification) => {
          return res.status(200).json({ liked_by_user: true });
        })
        .catch((err) => {
          return res.status(500).json({
            error: "failed to add the liked",
          });
        });
    } else {
      Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" })
        .then(() => {
          return res.status(200).json({
            liked_by_user: false,
          });
        })
        .catch((err) => {
          return res.status(500).json({
            error: err.message,
          });
        });
    }
  });
});

server.post("/isliked-by-user", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id } = req.body;

  Notification.exists({ user: user_id, type: "like", blog: _id })
    .then((result) => {
      return res.status(200).json({
        result,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        err: err.message,
      });
    });
});

server.post("/add-comment", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id, comment, blog_author, replying_to } = req.body;

  if (!comment.length) {
    return res.status(403).json({
      error: "write some thing to comment",
    });
  }

  //creating comment
  let commentObj = new Comment({
    blog_id: _id,
    blog_author,
    comment,
    commented_by: user_id,
  });

  if (replying_to) {
    commentObj.parent = replying_to;
    commentObj.isReply = true;
  }

  new Comment(commentObj).save().then(async (commetFile) => {
    let { comment, commentedAt, children } = commetFile;

    Blog.findOneAndUpdate(
      { _id },
      {
        $push: {
          comments: commetFile._id,
        },
        $inc: {
          "activity.total_comments": 1,
          "activity.total_parent_comments": replying_to ? 0 : 1,
        },
      }
    ).then((blog) => {
      console.log("new comment created");
    });

    let notificationObj = {
      type: replying_to ? "reply" : "comment",
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: commetFile._id,
    };

    if (replying_to) {
      notificationObj.replied_on_comment = replying_to;

      await Comment.findOneAndUpdate(
        { _id: replying_to },
        {
          $push: {
            children: commetFile._id,
          },
        }
      ).then((replyingToCommentDoc) => {
        notificationObj.notification_for = replyingToCommentDoc.commented_by;
      });
    }

    new Notification(notificationObj).save().then((notification) => {
      console.log("new notification created");
      return res.status(200).json({
        comment,
        commentedAt,
        _id: commetFile._id,
        user_id,
        children,
      });
    });
  });
});

server.post("/get-blog-comments", (req, res) => {
  let { blog_id, skip } = req.body;

  let maxLimit = 5;
  Comment.find({ blog_id, isReply: false })
    .populate(
      "commented_by",
      "personal_info.username personal_info.fullname personal_info.profile_img"
    )
    .skip(skip)
    .limit(maxLimit)
    .sort({
      commentedAt: -1,
    })
    .then((comment) => {
      console.log("the comment is ", comment);
      return res.status(200).json({
        comment,
      });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/get-replies", (req, res) => {
  let { _id, skip } = req.body;

  let maxLimit = 5;

  Comment.findOne({ _id })
    .populate({
      path: "children",
      option: {
        limit: maxLimit,
        skip: skip,
        sort: { commentedAt: -1 },
      },
      populate: {
        path: "commented_by",
        select:
          "personal_info.profile_img personal_info.fullname personal_info.username ",
      },
      select: "-blog_id -updatedAt",
    })
    .select("children")
    .then((doc) => {
      return res.status(200).json({
        replies: doc.children,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/delete-comment", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { _id } = req.body;

  Comment.findOne({ _id }).then((commet) => {
    if (user_id == commet.commented_by || user_id == commet.blog_author) {
      Comment.findOneAndDelete(commet._id).then((comment) => {
        Notification.findOneAndDelete({ comment: _id }).then((notification) => {
          console.log("notification deleted");
        });

        Blog.findOneAndUpdate(
          { _id: comment.blog_id },
          {
            $pull: {
              comments: _id,
            },
            $inc: { "activity.total_comments": -1 },
            "activity.total_parent_comments": -1,
          }
        )
          .then((message) => {
            console.log("done");
          })
          .catch((err) => {
            console.log(err.message);
          });
        return res.status(200).json({
          status: "done",
        });
      });
    } else {
      return res.status(403).json({
        error: "you cannnot delete ",
      });
    }
  });
});

server.get("/new-notification", verifyJWT, (req, res) => {
  const userId = req.user;

  Notification.exists({
    notification_for: userId,
    seen: false,
    user: { $ne: userId },
  })
    .then((result) => {
      if (result) {
        return res.status(200).json({
          new_notification_available: true,
        });
      } else {
        return res.status(200).json({
          new_notification_available: false,
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/notifications", verifyJWT, (req, res) => {
  let userId = req.user;

  let { page, filter, deletedDocCount } = req.body;

  let maxlimit = 10;
  let findQuery = { notification_for: userId, user: { $ne: userId } };

  let skipdocs = (page - 1) * maxlimit;

  if (filter != "all") {
    findQuery.type = filter;
  }

  if (deletedDocCount) {
    skipdocs -= deletedDocCount;
  }

  Notification.find(findQuery)
    .skip(skipdocs)
    .limit(maxlimit)
    .populate("blog", "title blog_id")
    .populate(
      "user",
      "personal_info.fullname personal_info.username personal_info.profile_img"
    )
    .populate("comment", "comment")
    .sort({ createdAt: -1 })
    .select("createdAt type seen reply")
    .then((notification) => {
      Notification.updateMany(findQuery, {
        seen: true,
      })
        .skip(skipdocs)
        .limit(maxlimit)
        .then(() => {
          console.log("notification seen");
        });

      return res.status(200).json(notification);
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/all-notification-count", verifyJWT, (req, res) => {
  let userId = req.user;

  let { filter } = req.body;

  let findQuery = { notification_for: userId, user: { $ne: userId } };

  if (filter != "all") {
    findQuery.type = filter;
  }

  Notification.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({
        totalDocs: count,
      });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({
        error: err.message,
      });
    });
});

server.post("/user-return-blogs", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { page, draft, query, deletedDocsCount } = req.body;

  console.log(page, draft, query, deletedDocsCount);

  let maxLimit = 5;

  let skipdocs = (page - 1) * maxLimit;

  if (deletedDocsCount) {
    skipdocs -= deletedDocsCount;
  }

  Blog.find({ author: user_id, draft, title: new RegExp(query, "i") })
    .skip(skipdocs)
    .limit(maxLimit)
    .sort({ publishedAt: -1 })
    .select("title banner publishedAt blog_id activity des draft -_id")
    .then((blogs) => {
      console.log(blogs);
      return res.status(200).json(blogs);
    })
    .catch((err) => {
      return res.status(400).json({
        error: err.message,
      });
    });
});

server.post("/user-written-blogs-count", verifyJWT, (req, res) => {
  let user_id = req.user;

  let { draft, query } = req.body;

  Blog.countDocuments({
    author: user_id,
    draft,
    title: new RegExp(query, "i"),
  })
    .then((count) => {
      return res.status(200).json({
        totalDocs: count,
      });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(400).json({
        error: err.message,
      });
    });
});

server.post("/delete-blog", verifyJWT, (req, res) => {
  let user_id = req.user;
  let isAdmin = req.admin;

  if (!isAdmin) {
    return res.status(500).json({
      error: "you dont have permission to delete the blog",
    });
  }

  let { blog_id } = req.body;

  Blog.findOneAndDelete({ blog_id })
    .then((blog) => {
      Notification.deleteMany({ blog: blog._id }).then((data) =>
        console.log("Notification deleted")
      );
      Comment.deleteMany({ blog_id: blog._id }).then((data) =>
        console.log("comments Deleted")
      );

      User.findOneAndUpdate(
        { _id: user_id },
        { $pull: { blogs: blog._id }, $inc: { "account_info.total_posts": -1 } }
      ).then((user) => console.log("blog deleted"));

      return res.status(200).json({
        status: "done",
      });
    })
    .catch((err) => {
      return res.status(500).json({
        error: err.message,
      });
    });
});

// server.post("/delete-blog", verifyJWT, (req, res) => {
//   let user_id = req.user;
//   let { blog_id } = req.body;

//   // Validate if blog_id is provided
//   if (!blog_id) {
//     return res.status(400).json({
//       error: "Blog ID is required.",
//     });
//   }

//   Blog.findOneAndDelete({ _id: blog_id })
//     .then((blog) => {
//       if (!blog) {
//         return res.status(404).json({
//           error: "Blog not found.",
//         });
//       }

//       return Promise.all([
//         Notification.deleteMany({ blog: blog_id }),
//         Comment.deleteMany({ blog_id: blog._id }),
//       ]);
//     })
//     .then(() => {
//       return User.findOneAndUpdate(
//         { _id: user_id },
//         { $pull: { blog: blog_id }, $inc: { "account_info.total_posts": -1 } },
//         { new: true }
//       );
//     })
//     .then((user) => {
//       if (!user) {
//         console.log("User not found.");
//         // You may choose to handle this case differently, depending on your application logic.
//       }

//       console.log("Blog deleted");
//       return res.status(200).json({
//         status: "done",
//       });
//     })
//     .catch((err) => {
//       console.error(err);
//       return res.status(500).json({
//         error: "Internal server error",
//       });
//     });
// });

server.listen(PORT, () => {
  console.log(`listing on ${PORT}`);
});
