Download nodejs first

clone this project

open project and:

    npm install
    
    npm init -y

download the packages

start app with:

    node app.js



# RestApi-ExpressJs

#### JWT Based Authentication

Login -> baseURL/auth/login

Register -> baseURL/auth/register

Logout -> baseURL/auth/logout


#### User Routes

Get All Users -> baseURL/users

Delete User -> baseURL/users/deleteUser

#### Post Routes

Get All Posts -> baseURL/posts

Get Specific User's Posts -> baseURL/posts/:userid/posts

Delete Post -> baseURL/posts/:id

Add Post -> baseURL/posts/addPost

Search Post -> baseURL/posts/search

When you fetch post its return posts, post's comments and post's likes.

#### Like Routes

Add Like -> baseUrl/likes/addLike

Delete Like -> baseUrl/likes/deleteLike

#### Comment Routes

Add Comment -> baseUrl/comments/addComment

Delete Comment -> baseUrl/comments/deleteComment

#### Exemple Projects

iOS-SwiftUI -> https://github.com/soKaradag/RestApi-CrudApp
