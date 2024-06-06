const sqlite3 = require('sqlite3')
const { Console } = require('console')

const db = new sqlite3.Database('myDb.db')

db.run(`
    CREATE TABLE IF NOT EXISTS Blogpost (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        postText TEXT
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS Guestbook (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        postText TEXT
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS Faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        postText TEXT,
        comment TEXT,
        dateOfPost DATE
    )
`)

//--------CREATE Posts--------\\
exports.createBlogPost = function(title, postText, callback){
    const values = [title, postText]
    const query = "INSERT INTO Blogpost (title, postText) VALUES (?,?)"
    
    db.run(query, values, function(error){
        if(error){
            callback(error)
        }
    })
}

exports.createGuestbook = function(title, postText, callback){
    const values = [title, postText]
    const query = "INSERT INTO Guestbook (title, postText) VALUES (?,?)"

    db.run(query, values, function(error){
        if(error){
            callback(error)
        }
    })
}

exports.createFaq = function(title, postText, callback){
    const values = [title, postText]
    const query = "INSERT INTO Faq (title, postText, dateOfPost) VALUES (?,?, datetime('now', 'localtime'))"

    db.run(query, values, function(error){
        callback(error)
    })
}

//--------RETRIEVE Posts--------\\
exports.getAllBlogposts = function(callback){
    const query = "SELECT * FROM Blogpost order by id desc"
    db.all(query, function(error, Blogpost){
        if(error) {
            callback(error, null)
        } else {
            callback(null, Blogpost)
        }
    })
}

exports.getAllGuestbooks = function(offset, callback){
    const values = [offset]
    const query = "SELECT * FROM Guestbook order by id desc LIMIT 3 OFFSET ?"

    db.all(query, values, function(error, Guestbook){
        callback(error, Guestbook)
    })
}

exports.getAllFaqs = function(callback){
    const query = "SELECT * FROM Faq order by id desc"

    db.all(query, function(error, Faq){
        callback(error, Faq)
    })
}

//-------GET POST BY ID------\\
exports.getBlogpostById = function(id, callback){
    const values = [id]
    const query = "SELECT * FROM Blogpost WHERE id = ?"
    
    db.get(query, values ,function(error, Faq) {
        callback(error, Faq)
    })
}

exports.getGuestbookById = function(id, callback){
    const values = [id]
    const query = "SELECT * FROM Guestbook WHERE id = ?"
    
    db.get(query, values ,function(error, Faq) {
        callback(error, Faq)
    })
}

exports.getFaqById = function(id, callback){
    const values = [id]
    const query = "SELECT * FROM Faq WHERE id = ?"
    
    db.get(query, values ,function(error, Faq) {
        callback(error, Faq)
    })
}


//--------UPDATE Posts--------\\
exports.updateBlogpost = function(id, title, newPostText, callback){
    const values = [title, newPostText, id]
    const query = "UPDATE Blogpost SET title = ?, postText = ? WHERE id = ?"

    db.run(query, values, function(error){
        if(error) {
            callback(error)
        } 
    })
}

exports.updateGuestbook = function(id, title, newPostText, callback){
    const values = [title, newPostText, id]
    const query = "UPDATE Guestbook SET title = ?, postText = ? WHERE id = ?"

    db.run(query, values, function(error){
        callback(error)
    })
}

exports.updateFaq = function(id, title, newPostText, comment, callback){
    const values = [title, newPostText, comment, id]
    const query = "UPDATE Faq SET title = ?, postText = ?, comment = ? WHERE id = ?"

    db.run(query, values, function(error){
        callback(error)
    })
}

//--------DELETE Posts--------\\
exports.deleteBlogpost = function(id, callback){
    const query = "DELETE FROM Blogpost WHERE id = ?"

    db.run(query, id, function(error){
        if(error){
            callback(error)
        }
    })
}

exports.deleteGuestbook = function(id, callback){
    const values = id
    const query = "DELETE FROM Guestbook WHERE id = ?"

    db.run(query, values, function(error){
        callback(error)
    })
}

exports.deleteFaq = function(id, callback){
    const values = id
    const query = "DELETE FROM Faq WHERE id = ?"

    db.run(query, values, function(error){
        callback(error)
    })
}

exports.searchFaq = function(searchText, searchTime, callback){
    searchText = "%" + searchText + "%"
    const values = [searchText, searchText, searchText, searchTime]
    const query = `SELECT * FROM Faq WHERE title LIKE ? OR postText LIKE ? OR comment LIKE ? GROUP BY dateOfPost HAVING dateOfPost<? ORDER BY id DESC`
    
    db.all(query, values, function(error, Faq){
        callback(error, Faq)
    })
}