Name: Roman Gibbons
Demo Project: A web based solar calculator application V2.0

Installation

To install the application, copy image directory and files (index.html, main.css and main.js) to any directory location on your local machine. Launch the index.html file using a modern browser.

Test Suite

-> Standard operation

1.	Launch index.html in Chrome browser
2.	Click the magnifier icon on the expand widget
3.	Enter �1334th Ave, New Auburn, WI, 54757, USA�
4.	Expand the solar calculator by clicking on the polygon icon on the expand widget
5.	Leave default values for orientation, tilt and height
6.	Click on the Draw Solar Panel button
7.	Draw a polygon of 4 vertices over the brightest area of the structure shown closest to the center of the map
8.	Double click to end drawing
9.	Results should be approximately:

Planimetric Area:
328.82 sqm
Panel Surface Area:
328.82 sqm
Nominal Power:
111.57 MWh/yr

10.	Change the tilt value to 15 degrees
11.	Results should be approximately:

Planimetric Area:
328.82 sqm
Panel Surface Area:
340.42 sqm
Nominal Power:
115.50 MWh/yr

12.	Change the height value to 10m
13.	Click the Calculate button
14.	Use the 3D control to change the tilt of the map
15.	Results should how 3D polygon
16.	Click on the polygon
17.	Press the delete key on the keyboard

-> Error catching operation

1.	Launch index.html in Chrome browser
2.	Expand the solar calculator by clicking on the polygon icon on the expand widget
3.	Click on the Draw Solar Panel button
4.	Draw a polygon anywhere on the map
5.	Double click to end drawing
6.	An alert should pop up �Please zoom to rooftop levels�
7.	Click the magnifier icon on the expand widget
8.	Enter �1334th Ave, New Auburn, WI, 54757, USA�
9.	Expand the solar calculator by clicking on the polygon icon on the expand widget
10.	Click on the Draw Solar Panel button
11.	Draw a polygon of 4 vertices over the brightest area of the structure shown closest to the center of the map
12.	Double click to end drawing
13.	Results should be approximately equal to values in 9 above
14.	Change the tilt value to 95 degrees
15.	Click on the Calculate button
16.	An alert should pop up �Please enter a tilt less than 90 degrees�
