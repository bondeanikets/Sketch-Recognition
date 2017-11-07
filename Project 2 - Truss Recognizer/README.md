------------------------------------------------------------------------------------
---------------------------------CSCE-624 Project 2---------------------------------
----------------------------------Truss Recognizer----------------------------------
------------------------------------------------------------------------------------

This projects intends to recognize Truss structures from free hand sketches available
in JSON format. The individual output contains the prediction of the sketch being a 
truss or not and the constituting stroke ids in case of a predicted Truss.

------------------------------------------------------------------------------------
-------------------------------------How to Run-------------------------------------
------------------------------------------------------------------------------------

Steps:
1. Place the input data file "data.json" in "/public" folder. The name of input file 
	is critical and should be renamed to "data.json" beforehand.
2. Open console and go to the project directory.
3. Run the server using the command "node server". The server will start listening on
	port 3000 locally.
4. Open a web browser and go to the address "localhost:3000". 
5. Click Start Processing.
6. Progress bar is not getting updated very frequently, Don't worry.
7. Now just Sit back and relax, or may be grab a cup of coffee.
8. If the page gets unresponsive, please click 'Continue' or 'Wait'.
9. When the process is finished, save the output json file to a suitable location.
10.The Confusion Matrix for both the Truss sketches and Truss Strokes will appear on screen.

------------------------------------------------------------------------------------
-------------------------------------Developers-------------------------------------
------------------------------------------------------------------------------------
Aniket Bonde	(UIN: 825009631 email: bondeanikets@tamu.edu)
Mayank Sharma	(UIN: 426007370 email: mayank.sharma@tamu.edu)
Niloofar Zarei  (UIN: 225002252 email: n.zarei.3001@tamu.edu)
