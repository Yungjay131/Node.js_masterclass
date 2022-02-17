const http = require('http');

let JSONTodos = [
    {
        id: 1, text: "This is Todo #1"
    },
    {
        id: 2, text: "This is Todo #2"
    },
    {
        id: 3, text: "This is Todo #3"
    }
];

let body = [];

const server = http.createServer((req, res) => {
    const { method, url: URL } = req;

    // response.statusCode = 404;

    // res.setHeader('Content-Type', 'text/plain');
    // response.setHeader('Content-Type', 'text/html');
    // response.setHeader('Content-Type', 'application/json');
    // response.setHeader('X-Powered-By', 'Node.js');
    // response.write("That's whatsup");



    req.on('data', chunk => {
        body.push(chunk);
    }).on('end', () => {
        // body = Buffer.concat(body);

        /* implemeting routing */
        let status = 404;
        const response = {
            success: false,
            data: null
        };

        switch (method) {
            case 'GET': {
                switch (URL) {
                    case '/todos': {
                        status = 200;
                        response.success = true;
                        response.data = JSONTodos;
                    }
                    case '/todos/': {

                    }


                }

            }
            case 'POST': {
                switch (URL) {
                    case '/todos': {
                        /*   const { id, text } = JSON.parse(body);
                          JSONTodos.push({ id, text });
  
                          status = 201;
                          response.success = true;
                          response.data = JSONTodos; */
                    }

                }
            }
        }


        /* actual way of setting the head object */
        res.writeHead(status, {
            'Content-Type': 'application/json',
            'X-Powered-By': 'Node.js'
        });

        res.end(JSON.stringify(response));

    });


});

const PORT = 5000;

server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
/* status codes
1.xx -> Informational

2.xx -> Success
200 -> Success
201 -> Created
204 -> No Content e.g deleting from DB

3.xx -> Redirection
304 ->Not Modified e.g after making a GET request but nothing was changed

4.xx -> Client Error
400 -> Bad Request e.g form submission request URL not formatted properly
401 -> Unauthorized
404 -> Not Found

5.xx -> Server Error
500 -> Internal Server Error
*/

/* GET,POST, PUT/PATCH, DELETE

formatting
GET/todos -> get all
GET/todos.1 -> get todo with ID 0f 1
POST/todos -> add a todo
PUT/todos/1 -> update todo with ID 0f 1*/