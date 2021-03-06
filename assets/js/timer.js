//
// Title: Speech Timer for Toastmasters
// Author: Stan Birdwell 
// Date: March 26, 2001
// Revised/ Extended:  Michael K. Heney
// Date: October 20, 2004
// **************************** Copyright Notice ****************************
// Copyright (C) 2001 Stan Birdwell
// Copyright (c) 2004 Michael K. Heney

// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
// ***************************************************************************
// This timer works in conjunction with timer.html. The timer is launched when the Start Timer
// button in timer.html is clicked. The timer increments from zero until the desired count is reached.
// Timer modes are initialized from the timer mode radio buttons in timer.html. 
//


var myTimerID ;
var flashTimerID ;

var Stop      = 0 ;
var Start     = 0 ;
var modeValue = 0 ;
var flash     = false ;
var flashing  = 0 ;

var totsecs = 0 ;
var minutes = 0 ;
var seconds = 0 ;

var custTime = 0 ;
var custTimeStr = "" ;
var custIndex = 5 ;

//preload images to be swapped

var imageGreen  = new Image() ;
var imageYellow = new Image() ;
var imageRed    = new Image() ;
var imageOff    = new Image() ;

imageGreen.src  = "assets/img/greenlight.gif" ;
imageYellow.src = "assets/img/yellowlight.gif" ;
imageRed.src    = "assets/img/redlight.gif" ;
imageOff.src    = "assets/img/offlight.gif" ;


// modeValue is speech timing:  
// 0 = Table Topics (1:00 / 1:30 /  2:00)
// 1 = Evaluation   (2:00 / 2:30 /  3:00)
// 2 = Icebreaker   (4:00 / 5:00 /  6:00)
// 3 = Std. Speech  (5:00 / 6:00 /  7:00)
// 4 = 8-10 Speech  (8:00 / 9:00 / 10:00)
// 5 = Custom       (set at will ....)
// 6 = Test         (set at will ....)
// Disqualification time is Red + 30 seconds (ex. test)

var doGreen  = new Array( 60, 120, 240, 300, 480, -1,  2) ;
var doYellow = new Array( 90, 150, 300, 360, 540, -1,  4) ;
var doRed    = new Array(120, 180, 360, 420, 600, -1,  6) ;
var doFlash  = new Array(150, 210, 390, 450, 630, -1,  8) ;

//
// The getStarted() function is called by the "Start/Restart Timer" button in timer.html
//
function expando(){
	document.getElementById("info").style.visibility="hidden";
	document.getElementById("disqual").checked=true;
	
}
function getStarted()
{

    // Test to see if Timer has already been started. If No, then proceed with count down, 
    // if Yes, then reset timer.

    if (Start == 0)
    {
		document.getElementById("info").style.visibility="hidden";
		document.getElementById("start").className = "";
		document.getElementById("start").className = "btn btn-large btn-danger input-margin";
        // start with a sanity check - read which timer option is selected,
        // and if Custom, make sure the times are reasonable BEFORE we start
        // doing anything else ...

        for (i = 0; i < document.myForm.speechType.length; i++)
            if (document.myForm.speechType[i].checked)
                modeValue = i ;
        document.myForm.Mode.value = modeValue;	

        // if custom timing, make sure values make sense
        if (modeValue == custIndex)
        {
            if (    (doGreen[custIndex] <= 0)
                 || (doYellow[custIndex] <= doGreen[custIndex])
                 || (doRed[custIndex] <= doYellow[custIndex]) )
            {
                alert("Error - values for all three times (green, yellow, and red)\n" +
                      "   - must be specified,\n" + 
                      "   - must be non-zero, and\n" +
                      "   - must be in increasing order." ) ;

                return ;
            }            
            doFlash[custIndex] = doRed[custIndex] + 30 ;
        }

        // initaialize / clear things for this timing session 

        Stop = 0 ;
        Start = 1 ;
    
        minutes = 0 ;
        seconds = 0 ;
        totsecs = 0 ;
        writeMinSec() ;

        offLights() ;

        flashing = 0 ;
        document.myForm.flashing.value = flashing ;

        flash = false ;
        document.myForm.flash.value = flash ;

        document.myForm.StartStop.value = "Stop Timer" ;
        document.myForm.flashTimerID.value = "" ;


       //-- Pauses one second, then calls the addOne function at 1 second intervals.

        myTimerID = setInterval("addOne()",1000) ;
        document.myForm.timerID.value = myTimerID ;
    }

    else
    {
		document.getElementById("info").style.visibility="visible";
		document.getElementById("start").className = "";
		document.getElementById("start").className = "btn btn-large btn-success input-margin";
        // Timer is running - stop it.
        Stop = 1 ;
        Start = 0 ;
        clearInterval(myTimerID);
        if (flashing)
        {
            clearInterval(flashTimerID) ;
            onLights() ;
        }

        document.myForm.StartStop.value = "Start Timer" ;
    }
}


//-- This function adds one to the current value in the form field

function addOne()
{
    // bail if "Stop Timer" was pressed

    if (Stop)
        return ;

    // increment the time by one second 

    totsecs = totsecs + 1 ;
    seconds = seconds + 1 ;
    if (seconds == 60)
    {
        seconds = 0 ;
        minutes = minutes + 1 ;
    }
    
    writeMinSec();

    // write the following values for debug
    document.myForm.flashing.value = flashing ;

    
    //check for Green Light
    if (totsecs == doGreen[modeValue])
    {
        reachedGreenLight() ;
    }

    //check for Yellow Light
    if (totsecs == doYellow[modeValue])
    {
        reachedYellowLight() ;
    }

    //check for Red Light
    if (totsecs == doRed[modeValue])
    {
        reachedRedLight() ;
    }

    //check for Disqualification time - FLASH LIGHTS!!!!!!
    if (totsecs == doFlash[modeValue])
    {
        reachedDisqual() ;
    }

}


//This function turns on the Green Light
function reachedGreenLight()
{
    document.green.src  = imageGreen.src ;

}


//This function turns on the Yellow Light
function reachedYellowLight()
{
    document.green.src  = imageOff.src ;
    document.yellow.src = imageYellow.src ;

}


//This function turns on the Red Light
function reachedRedLight()
{
    document.yellow.src = imageOff.src ;
    document.red.src    = imageRed.src ;
	
}


//-- This function is called when the disqualification time is reached.
function reachedDisqual(count)
{
	document.getElementById('audio').play();
    if (document.myForm.disqualFlash.checked)
    {
        flashing = 1 ;
        document.myForm.flashing.value = flashing ;

        onLights() ;

	flash = false ;
        document.myForm.flash.value = flash ;

	flashTimerID = setInterval("flashLights()",500) ;
        document.myForm.flashTimerID.value = flashTimerID ;
    }
}


function flashLights()
{
    // do a check for Stop in case we've reset but timer hasn't 
    // cleared yet ...
	document.getElementById('audio').play();
    if (Stop == 1)
        return ;

    if (flash == false)
        onLights() ;
    else
        offLights() ;

    flash = !flash ;
    document.myForm.flash.value = flash ;
}


function onLights()
{
    document.green.src  = imageGreen.src ;
    document.yellow.src = imageYellow.src ;
    document.red.src    = imageRed.src ;
}


function offLights()
{
    document.green.src  = imageOff.src ;
    document.yellow.src = imageOff.src ;
    document.red.src    = imageOff.src ;
}


// The user has clicked the "Master Reset" button.  We execute a Stop, making
// sure everything is set back to it's initial value.  (Some things don't
// matter, since (re)starting the timer will initialize most variables, and
// the reset function called will clear all text fields....)


function setStop()
{
	
	document.getElementById("info").style.visibility="hidden";
	document.getElementById("start").className = "";
		document.getElementById("start").className = "btn btn-large btn-success input-margin";
    Stop = 1 ;
    Start = 0 ;

    clearInterval(myTimerID);
    if (flashing)
    {
        clearInterval(flashTimerID) ;
    }

    offLights() ;
    document.myForm.StartStop.value = "Start Timer" ;
    document.myForm.reset() ;
	document.getElementById("disqual").checked=true;
}


function writeMinSec()
{
	
    //document.myForm.Minutes.value = minutes ;

    if (seconds < 10)
        //document.myForm.Seconds.value = '0' + seconds ;
		document.getElementById("elapsed-time").innerHTML = minutes+" m "+"0" + seconds+" s";
    else
        //document.myForm.Seconds.value = seconds ;
		document.getElementById("elapsed-time").innerHTML = minutes+" m "+ seconds+" s";
}


// setSpeech handles the speech selection radio buttons

function setSpeech(speechIndex)
{

    if (Start == 1)
    {
        // if already running, complain and reset radio button to previous value
        
        alert("Timer is runnning! Click OK below then Stop the timer and reselect Speech Type.");
        document.myForm.speechType[modeValue].checked = true;
    }
      
}


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Mike's new stuff for custom timers
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


// chkTimeFormat verifies that a time format is valid ...
// Global variable custTime doubles as "goodness" flag - 
// it's number of seconds indicated for good; -1 for bad

function chkTimeFormat(str)
{
    var slen = str.length ;
    var gotColon = 0 ;
    var myMin ;
    var mySec ;

    custTimeStr = "" ;
    custTime = -1 ;

    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    // a couple initial sanity checks ...
    // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

    if (slen == 0)
       return (-1);

    while ( (slen > 1) && (str.substring(0,1) == "0") && (str.substring(1,2) != ":") )
    {
        // strip excess leading zeroes
        str = str.substring(1, slen) ;
        slen -= 1 ;
    }

    if (str.substring(0,1) == ":")
    {
        // if we start with a ":", prepend a zero
        str = "0" + str ;
        slen += 1 ;
    } 


    // valid formats are all digits (minutes only)
    // or minutes:seconds (2 digit seconds)

    for (i = 0; i < slen; i++)
    {
        c = str.substring(i,i+1)
        if ( (c < "0") || (c >"9") )
        {
            if ( (c != ':') || (i != (slen - 3)) )
                return (-1) ;
            gotColon = 1 ;
        }
    }

    // Make sure seconds are in 00-59 range ....
    if (gotColon && (str.substring(slen-2, slen-1) > "5") )
        return (-1) ;

    // restrict values to 999 minutes (actually 999:59) or less
    if ( slen > (3 + (gotColon*3)) )
        return (-1) ;    


    // get both a numeric and "clean" string representation of
    // the value entered ...
    if (gotColon)
    {
        myMin = parseInt(str.substring(0,slen-3)) ;
        mySec = parseInt(str.substring(slen-2,slen))   ;
    }    
    else
    {
        myMin = parseInt(str) ;
        mySec = 0 ;
    }

    if (mySec < 10)
        custTimeStr = myMin + ":0" + mySec ;
    else
        custTimeStr = myMin + ":" + mySec ;

    custTime = (myMin * 60) + mySec ;
    return (custTime) ;

}


// parseTime takes care of handling a time string ...
function parseTime(which)
{
    if (which == 0)
    {
        chkTimeFormat(document.myForm.greenAt.value) ;
        document.myForm.greenAt.value = custTimeStr ;
        doGreen[custIndex] = custTime ;
    }
    else if (which == 1)
    {
        chkTimeFormat(document.myForm.yellowAt.value) ;
        document.myForm.yellowAt.value = custTimeStr ;
        doYellow[custIndex] = custTime ;
    }
    else if (which == 2)
    {
        chkTimeFormat(document.myForm.redAt.value) ;
        document.myForm.redAt.value = custTimeStr ;
        doRed[custIndex] = custTime ;
    }
}
