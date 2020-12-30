# carrent-sl
Car Rent SL Project Source Code

To use the source code on your own system, you need to have the following servers and softwares installed on your computer
1. NodeJS
2. Mongodb
3. Git
4. VS Code

After cloning the repository to your pc, you need to open the terminal/command prompt in that directory and type
"npm install --save"

After it has finished installing, you can then create a file called ".env"
Open the .env file and paste the following inside
1. PORT=2000
2. MONGODB=mongodb://localhost/carrent
3. MONGOOSE=mongodb://localhost/carrent_files

Then start the mongodb server by typing 
1. mongod  for windows, and
2. sudo mongod for linux/mac

Then go back to VS Code terminal and type
1. node app.js to start the server

Open your web browser and type "localhost:2000/"
