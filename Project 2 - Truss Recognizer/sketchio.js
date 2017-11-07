/**
 * The SketchIo "namespace" primarily focuses on converting the standard sketch object that is used
 * in the sketch recognition projects of Texas A&M University's Sketch Recognition Lab, and
 * "simplifies" this object into a compact sketch object that is more streamlined for use in
 * code in class projects and test interfaces.
 */
var SketchIo = {

  /**
   * Simplifies (i.e., cleans a compacts) the standard sketch object to a compact sketch object.
   * @param {Object} input - The raw standard sketch object.
   * @return {Object} The clean compact sketch object.
   */
  simplify: function(input) {
    // error-checking #0: check if input exists
    if (input === null || input === undefined) {
      if (this.debugFlag) console.log("ERROR #0: sketch does not exist");
      return null;
    }

    // error-checking #1: check if input has shapes
    if (input.shapes === null || input.shapes === undefined || input.shapes.length === 0) {
      if (this.debugFlag) console.log("ERROR #1: sketch has no shapes");
      return null;
    }

    // error-checking #2: check if interpretation property exists
    if (!(input.shapes[0]).hasOwnProperty("interpretation")) {
      if (this.debugFlag) console.log("ERROR #2: sketch does not have interpretation property");
      return null;
    }

    // get the interpretation
    var interpretation = input.shapes[0]["interpretation"];

    // error-checking #3: check if strokes property exists
    if (!input.hasOwnProperty("strokes")) {
      if (this.debugFlag) console.log("ERROR #3: sketch does not have strokes property");
      return null;
    }

    // console.log("----- DEBUG -----")
    // console.log("input.strokes? " + !input.hasOwnProperty("strokes"));
    // console.log();

    // error-checking #4: check if strokes exist
    if (input.strokes === null || input.strokes === undefined || input.strokes.length === 0) {
      if (this.debugFlag) console.log("ERROR #5: sketch has no strokes");
      return null;
    }

    // error-checking #5: check if points property exists
    if (!input.hasOwnProperty("points")) {
      if (this.debugFlag) console.log("ERROR #4: sketch does not have points property");
      return null;
    }

    // convert the standard sketch object's structure to compact format
    var sketch = this.compact(input);

    // error-check #18: check if sketch has any strokes after compacting
    if (sketch === null) {
      if (this.debugFlag) console.log("ERROR #18: sketch is empty after compacting");
      return null;
    }

    // iterate through the strokes
    var c = [];
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {
      // get the current stroke
      var stroke = strokes[i];

      // error-checking #6: check if current stroke exists
      if (stroke === null || stroke === undefined) {
        if (this.debugFlag) console.log("ERROR #6: stroke #" + i + " does not exist");
        continue;
      }

      // error-checking #7: check if current stroke has points property
      if (!stroke.hasOwnProperty("points")) {
        if (this.debugFlag) console.log("ERROR #7: stroke #" + i + " does not have points property");
        continue;
      }

      // error-checking #8: check if current stroke has points
      var points = stroke.points;
      if (points.length === 0) {
        if (this.debugFlag) console.log("ERROR #8: stroke #" + i + " does not have points");
        continue;
      }
    }

    return sketch;
  },

  /**
   * Converts the standard sketch object to a compact sketch object.
   * @param {(standard) Sketch} input - The sketch object in standard format.
   * @return {(compact) Sketch} The sketch object in compact format.
   */
  compact: function(input) {
    // get the old strokes and initialize the new strokes
    var oldStrokes = input.strokes;
    var newStrokes = [];

    // iterate through each old stroke
    for (var i = 0; i < oldStrokes.length; i++) {
      // get the current old stroke and initialize new points
      var oldStroke = oldStrokes[i];
      var newPoints = [];

      // iterate through each old point ID
      for (var j = 0; j < oldStroke.points.length; j++) {
        // get the old point ID and map to the new point
        var oldPointId = oldStroke.points[j];
        var newPoint = input.points[oldPointId];

        // error-check #9: check if point ID is mapped to an actual point
        if (newPoint === null || newPoint === undefined) {
          if (this.debugFlag) console.log("ERROR #9: point ID does not map to an actual point");
          continue;
        }

        // add the old point ID to the new point
        newPoint.id = oldPointId;

        // ----- start error-checking -----

        // error-check #10: check if point has x property
        if (!newPoint.hasOwnProperty("x")) {
          if (this.debugFlag) console.log("ERROR #10: point" + i + " does not have x property");
          continue;
        }

        // error-check #11: check if point has numerical x-value
        if (typeof newPoint.x !== 'number' || Number.isNaN(newPoint.x)) {
          if (this.debugFlag) console.log("ERROR #11: point" + i + " does not have a valid x-value");
          continue;
        }

        // error-check #12: check if point has y property
        if (!newPoint.hasOwnProperty("y")) {
          if (this.debugFlag) console.log("ERROR #12: point" + i + " does not have y property");
          continue;
        }

        // error-check #13: check if point has numerical y-value
        if (typeof newPoint.y !== 'number' || Number.isNaN(newPoint.y)) {
          if (this.debugFlag) console.log("ERROR #13: point" + i + " does not have a valid y-value");
          continue;
        }

        // error-check #14: check if point has time property
        if (!newPoint.hasOwnProperty("time")) {
          if (this.debugFlag) console.log("ERROR #14: point" + i + " does not have time property");
          continue;
        }

        // error-check #15: check if point has numerical time-value
        if (isNaN(newPoint.time)) {
          if (this.debugFlag) console.log("ERROR #15: point" + i + " does not have a valid time-value");
          continue;
        }

        // convert new point's time to number
        newPoint.time = Number.parseInt(newPoint.time);

        // ----- end error-checking -----

        //
        newPoints.push(newPoint);
      }

      // error-check #16: check if there are any points after cleaning
      if (newPoints.length === 0) {
        if (this.debugFlag) console.log("ERROR #16: points array is empty after cleaning");
        continue;
      }

      // create new stroke from new points, add its ID from old stroke,
      // and add new stroke to array of new strokes
      var newStroke = {points: newPoints};
      newStroke.id = oldStroke.id;
      newStroke.time = newPoints[0].time;
      newStroke.points = newPoints;
      newStrokes.push(newStroke);
    }

    // error-check #17: check if there are any strokes after cleaning
    if (newStrokes.length === 0) {
      if (this.debugFlag) console.log("ERROR #17: strokes array is empty after cleaning");
      return null;
    }

    // create new sketch
    var sketch = {};
    sketch.id = input.id;
    sketch.strokes = newStrokes;
    sketch.time = sketch.strokes[0].points[0].time;

    return sketch;
  },

  /**
   * Gets the string representation of the compact sketch object's entire data properties.
   * @param {Object} sketch - The compact sketch object.
   * @return {string} The compact sketch object's string representation. 
   */
  getString: function(sketch) {
    // initialize the string representation.
    var output = "";

    // include the sketch-level property data
    output += "sketch.id: " + sketch.id + "\n";
    output += "sketch.time: " + sketch.time + "\n";
    output += "sketch.strokes.length: " + sketch.strokes.length + "\n";

    // include the stroke-level property data
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {

      var stroke = strokes[i];
      var points = stroke.points;
      output += "  stroke.id: " + stroke.id + "\n";
      output += "  stroke.points.length: " + stroke.points.length + "\n";

      // include the point-level property data
      for (var j = 0; j < points.length; j++) {
        var point = points[j];
        output += "    x: " + point.x + ", y: " + point.y + ", time: " + point.time + ", ID: " + point.id + "\n";
      }
    }

    return output;
  },

  /**
   * The debug output flag for testing the namespace's function correctness.
   */
  debugFlag: false,
}
