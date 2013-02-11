# GraphButton, a circuit that posts to the Open Graph

**What you’ll learn:** How to create a circuit that posts an action to your profile on the Open Graph.

**What you'll need:**
* An Electric Imp
* An Electric Imp breakout board, or an Arduino + an Electric Imp Shield
* A switch or some wire

## Setting up an Arduino + Electric Imp Shield

Make sure you have the Arduino Software installed: http://arduino.cc/en/main/software

Open up the Arduino IDE. Make sure your Arduino works by going to File -> Examples -> Basic -> Blink. Upload the code to your Arduino by selecting the correct usb port on Tools->Serial Port and select the correct arduino board from Tools->board. Upload your the blink code by clicking on the upload button. 

This will make a light on your Arduino blink and is a super basic test of whether everything is working. 
Build your Electric Imp Shield. This will require soldering the header pins into the board.
Plug your Electric Imp into your Electric Imp Shield and mount your shield onto your Arduino.

## Setting up the Imp

Follow the Electric Imp Tutorial here: http://devwiki.electricimp.com/doku.php?id=helloworld

Create an Electric Imp account at https://plan.electricimp.com/login. Next, download the Electric Imp app to your mobile device. Open the app, and configure the local wifi network your Imp will connect to. When you click “Send BlinkUp”, ensure the Electric Imp was just turned on and is flashing red and orange.

*Troubleshooting:* It helps to cover the Imp with your thumb and put your phone right up to the Imp to minimize outside light interference.

<img src="http://www.instructables.com/files/deriv/FQI/UVAU/H9K2GBYV/FQIUVAUH9K2GBYV.LARGE.jpg" height="200">

Login to http://plan.electricimp.com. Click the “Code” panel in the menu at the top of the screen, then the “+” button. This creates for us a new Imp script. Give it the name “GraphButton”, then click OK. Next, the code editor is shown.

Copy the following code into the block and click the save icon:

```c
// GraphButton source code
 
// Set output port for planner.
local output = OutputPort("trigger");
 
// Callback when the button is pressed.
function pin7changed() {
    local buttonState = hardware.pin7.read();
 
    // If buttonState is 0, the button is pushed.
    if (buttonState == 0) {
        hardware.pin8.write(0);
        output.set("trigger");
        server.show("Button Pressed!");
    } else {
        hardware.pin8.write(1);
        server.show("Button Released!");
    }
}
 
// LEDs on pin 8 is active low, so writing the pin a 1 will turn the LED off.
hardware.pin8.configure(DIGITAL_OUT_OD_PULLUP);
hardware.pin8.write(1);
server.show("LEDs configured.");
 
// Pin 7 is a digital input (0 or 1) and is pulled up externally.
hardware.pin7.configure(DIGITAL_IN_PULLUP, pin7changed);
 
// Register with the server
imp.configure("GraphButton POSTer", [], [output]);
 
// Display our important message
server.show("GraphButton ready.");
```

Go to the “Planner” panel via the top menu. Hover the only code box on your planner, then click the sliders in the upper right when they appear. Select “GraphButton” from the dropdown list. In a little bit, if your imp is connected to the internet, it should read “GraphButton ready.”

*Troubleshooting:* If you have an issue with the code block not seeming to switch scripts, try resetting the Imp by ejecting and reinserting the card. If the Imp is on and this fails, try creating a second script and switching back and forth between them.

![http://i.imgur.com/3Hij00B.png](http://i.imgur.com/3Hij00B.png)

Log into http://graphbutton.herokuapp.com/, then copy the action URL it gives you.

In the Planner tab, click “Add Node” in the upper left and choose “HTTP Request” as the node type. Hover over the block to reveal the settings icon, and in the settings, set the request type to “POST” and paste the action URL. Finally, drag the + connection from the GraphButton block to the HTTP Request block.

![http://i.imgur.com/UjTFMIL.png](http://i.imgur.com/UjTFMIL.png)

Connect a button, switch, or two pieces of disconnected wire between PIN 7 and Ground. If your imp is connected to the internet, you should see in the Imp Planner that connecting the switch will change the block’s text to “Button pressed!”.

To confirm it worked, go to your profile and click Activity Log. On the left menu, click “Apps”. You should see that you just posted to the open graph!

*Troubleshooting:* Make sure that you’re still logged into the GraphButton Heroku app.


## Running your own server

The source code for the GraphButton server is open source, so you can fork it and start your own. To clone the repository:

```
$ git clone https://github.com/lifegraph/graphbutton
$ heroku create
$ heroku config:add HOST=<heroku host>
```

### Creating a Facebook app

Log into https://developers.facebook.com/apps. Create a new application. "GraphButton Test", "lifegraphlabs" is the namespace
Copypasta your <heroku host> into the App Domains entry.
Website with Facebook Login, site URL: http://<heroku host>/
Save
Copy app ID and app SECRET. paste to 

```
$ heroku config:add FB_KEY=the key
$ heroku config:add FB_SECRET=the secret
$ heroku config:add FB_ACTION=the action
```

Open Graph on the left. Click Getting Started. “press” a “button”. Probably select Number of units.
Must be “button” or else the POST payload has to be changed
Save changes and next
Define object type: button. Savenext
Data to Display, click “Press”..
Click number, Save and Finish

Click your Press action “get code”
copy “lifegraphlabs:press“ for the path