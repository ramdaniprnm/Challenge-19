var http = require("http");
var fs = require("fs");
const data = [
  { name: "Ringgo", age: 20 },
  { name: "Ramdan", age: 18 },
];

http
  .createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/html" });
    let html = "";
    console.log(req.url);
    switch (req.url) {
      case "/":
        html =
          "<a href='/add'>Create</a><h1>JSON CRUD(Create,Read,Update,Delete)</h1><ol>";
        data.forEach((item) => {
          html += `<li>${item.name} - ${item.age}</li>`;
        });
        html += "</ol>";
        break;
      case "/add":
        html = "<h1>ADD</h1>";
        if (req.method === "POST") {
          let body = "";
          req.on("data", (content) => {
            body += content;
          });
          req.on("end", () => {
            let params = new URLSearchParams(body);
            const name = params.get("name");
            const age = params.get("age");
            data.push({ name, age });
            res
              .writeHead(301, {
                Location: "http://localhost:3000/",
              })
              .end();
          });
        } else {
          html = `<form method="POST">
                    <input type="text" name="name" placeholder="Insert your name"/><br>
                    <input type="number" name="height" placeholder="Insert your height"/><br>
                    <input type="number" name="weight" placeholder="Insert your weight"/><br>
                    <input type="date" name="birthdate" placeholder="Insert your birthdate"/><br>
                    <button type="submit">Save</button>
                    <button type="button" onclick="window.location='/'">Cancel</button>
                  </form>`;
        }
        break;
      case "/update":
        html = "<h1>Update</h1>";
        break;
      case "/delete":
        html = "<h1>Delete</h1>";
        break;
      default:
        html = "<h1>404 Not Found</h1>";
        break;
    }
    res.end(html);
  })
  .listen(3000);
