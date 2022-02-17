const http = require('http');

const mockData = [
    {id: 0, name:"Joshua"},
    {id: 1, name:"Sylvanus"},
    {id: 2, name:"Josh"}
]
const server = http.createServer((req, res) => {
    const { headers, url, method } = req;
    console.log(headers, url, method);
    console.log(req.headers.authorization);
   /*  res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Powered-By','Node.js');
    res.statusCode = 404; */

    /* combining res.setHeader() and statusCode */
    res.writeHead(404, {
        'Content-Type:': 'Application/json',
        'X-Powered-By': 'Node.js'
    })
    // res.write("Response successful");
    res.end(JSON.stringify({
        success: true,
        data: mockData
    }));
});

/* testing middleware, it requires Express tho */
const logger = (req,res,next) =>{
    /* adding param to the req object */
    req.hello = "Hello World";
    console.log('MiddleWare ran');
    next();
}
const PORT = 5_000;

server.listen(PORT, () => console.log(`Server is running on Port ${PORT}`));

/* 1.xx: Informational
   
   2.xx: Success
   200: success
   201: created
   204: no content
   
   3.xx: Redirection
   304: not modified

   4.xx: Client Error
   400: bad request
   401: unauthorized
   404: not found

   5.xx: Server Error
   500: internal server error
   */