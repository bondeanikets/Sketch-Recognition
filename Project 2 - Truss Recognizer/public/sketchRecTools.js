var SketchRecTools = {

  resampleByCount: function(sketch, n) {
		var S = this.calculatePathLength(sketch) / (n - 1);

		return this.getResample(sketch, S);
  },

	resampleByDistance: function(sketch, S) {

		if (typeof S === "undefined") {
			S = this.determineResampleSpacing(sketch);
		}

		return this.getResample(sketch, S);
	},

  determineResampleSpacing(sketch) {
    var box = this.calculateBoundingBox(sketch);
    var diagonal = this.calculateDistance(box.minX, box.minY, box.maxX, box.maxY);
    S = diagonal / 40.0;

    return S;
  },

  /**
   * Resamples the sketch on an interspacing distance.
   * @param {Sketch} sketch - The target sketch.
   * @param {number} S - The interspacing distance.
   * @return {Sketch} The resampled sketch.
   */
  getResample: function(sketch, S) {
    //  initialize the variables
    var D = 0.0;
    var newStrokes = [];
    var strokes = sketch.strokes;

    // iterate through the strokes
    for (var i = 0; i < strokes.length; i++) {
      // get the current stroke, and skip if no points
      var stroke = strokes[i];
      if (stroke.points.length === 0) { continue; }

      // get the raw points
      var points = [];
      for (var j = 0; j < stroke.points.length; j++) {
        // get the current stroke point and add it to the points list
        var p = stroke.points[j];
        points.push(p);
      }

      // initialize the resampled points with the first raw point
      var newPoints = [];
      newPoints.push( {x: points[0].x, y: points[0].y, time: points[0].time} );

      // get the resampled points
      for (var j = 1; j < points.length; j++) {
        // get the previous and current point
        var prevPoint = points[j - 1];
        var currPoint = points[j];

        // get the distance between the previous and current point
        var d = this.calculateDistance(prevPoint.x, prevPoint.y, currPoint.x, currPoint.y);

        // check for ready resampled points
        if (D + d >= S) { // resampled point ready

          // set the resampled point's (x, y, t)
          var qx = prevPoint.x + ((S-D)/d)*(currPoint.x-prevPoint.x);
          var qy = prevPoint.y + ((S-D)/d)*(currPoint.y-prevPoint.y);
          var qt = currPoint.time;

          // set the resampled point data
          var q = {x: qx, y: qy, time: qt};

          // insert the resampled point into the raw and resampled point list
          newPoints.push(q);
          points.splice(j, 0, q);
          D = 0.0;
        }
        else { D += d; } // resampled point ready
      }

      // reset the distance counter for the next stroke
      D = 0.0;

      // wrap the resampled points to a stroke and add it to array of resampled strokes
      newStroke = {points: newPoints};
      newStrokes.push(newStroke);
    }

    // wrap the resampled strokes into a resampled sketch and return
    var newSketch = {strokes: newStrokes};
    return newSketch;
  },

  /**
   * Calculates the bounding box.
   * @param {Sketch} sketch - The target sketch.
   * @return {Box} The target sketch's bounding box.
   */
  calculateBoundingBox: function(sketch) {
    // bounding box is null if there is not sketch or sketch strokes
    if (sketch === null || sketch === undefined || sketch.strokes === null || sketch.strokes === undefined || sketch.strokes.length === 0) {
      return null;
    }

    var strokes = sketch.strokes;
    var point0 = strokes[0].points[0];
    var minX = point0.x;
    var minY = point0.y;
    var maxX = point0.x;
    var maxY = point0.y;

    for (var i = 0; i < strokes.length; i++) {

      var points = strokes[i].points;
      for (var j = 0; j < points.length; j++) {

        var point = points[j];
        if (point.x < minX) { minX = point.x; }
        else if (point.x > maxX) { maxX = point.x; }
        if (point.y < minY) { minY = point.y; }
        else if (point.y > maxY) { maxY = point.y; }
      }
    }
    var centerX = minX + ((maxX - minX) / 2);
    var centerY = minY + ((maxY - minY) / 2);

    var topLeft = {x: minX, y: minY};
    var topRight = {x: maxX, y: minY};
    var bottomLeft = {x: minX, y: maxY};
    var bottomRight = {x: maxX, y: maxY};
    var center = {x: centerX, y: centerY};

    var width = maxX - minX;
    var height = maxY - minY;

    var box = {topLeft: topLeft,
      topRight: topRight,
      bottomLeft: bottomLeft,
      bottomRight: bottomRight,
      center: center,
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY,
      centerX: centerX,
      centerY: centerY,
      height: height,
      width: width};
    return box;
  },

  calculateDistance: function(x0, y0, x1, y1) {

    return Math.sqrt( (x1 - x0)*(x1 - x0) + (y1 - y0)*(y1 - y0)  );
  },

  calculatePathLength: function(sketch) {

    var distances = 0.0;

    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      for (var j = 0; j < points.length - 1; j++) {

        var p0 = points[j];
        var p1 = points[j + 1];
        distances += this.calculateDistance(p0.x, p0.y, p1.x, p1.y);
      }
    }

    return distances;
  },

  /**
   * Translate the sketch to a point.
   * @param {Sketch} sketch - The target sketch.
   * @param {number} x - The destination x-coordinate.
   * @param {number} y - The destination y-coordinate.
   * @return {Sketch} The translated sketch.
   */
  translate: function(sketch, x, y) {
    if (sketch === null || sketch === undefined || sketch.strokes === null || sketch.strokes === undefined || sketch.strokes.length === 0) {
      return null;
    }

    // get the current strokes and initialize the new strokes
    var strokes = sketch.strokes;
    var newStrokes = [];

    // iterate through each stroke
    for (var i = 0; i < strokes.length; i++) {

      // get the current points and initialize the new points
      var points = strokes[i].points;
      var newPoints = [];

      // iterate through each point
      for (var j = 0; j < points.length; j++) {

        // get the current point
        var point = points[j];

        // get the translated point
        var qx = point.x + x;
  			var qy = point.y + y;
        var qtime = point.time;
        var q = {x: qx, y: qy, time: qtime};

        // add the new point
        newPoints.push(q);
      }

      newStrokes.push({points: newPoints});
    }

    var newSketch = {strokes: newStrokes};
    return newSketch;
  },

  translateToPoint: function(sketch, point) {
    if (sketch === null || sketch === undefined || sketch.strokes === null || sketch.strokes === undefined || sketch.strokes.length === 0) {
      return null;
    }
    if (point === null || point === undefined) {
      return null;
    }

    // get the sketch's bounding box and its center
    var box = this.calculateBoundingBox(sketch);
    var center = box.center;

    // get the x- and y-deltas
    var x = point.x - center.x;
    var y = point.y - center.y;

    //
    var newSketch = this.translate(sketch, x, y);
    return newSketch;
  },

  translateToMidpoint: function(sketch, point) {
    var newSketch = this.translateToPoint(sketch, point);
    return newSketch;
  },

  translateToCentroid: function(sketch, point) {
    // calculate the centroid
    var sumX = 0;
    var sumY = 0;
    var count = 0;
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      for (var j = 0; j < points.length; j++) {
        var p = points[j];
        sumX += p.x;
        sumY += p.y;
        ++count;
      }
    }

    var meanX = sumX / count;
    var meanY = sumY / count;

    var moveX = point.x - meanX;
    var moveY = point.y - meanY;

    var newSketch = this.translate(sketch, moveX, moveY);

    return newSketch;
  },

  scaleProportional: function(sketch, size) {
    // get the bounding box and determine scale
    var box = this.calculateBoundingBox(sketch);
    var scale = box.height > box.width ? size / box.height : size / box.width;

    // get the offset
    var xOffset = Number.MAX_SAFE_INTEGER;
    var yOffset = Number.MAX_SAFE_INTEGER;
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      for (var j = 0; j < points.length; j++) {
        var point = points[j];
        if (point.x < xOffset) { xOffset = point.x; }
        if (point.y < yOffset) { yOffset = point.y; }
      }
    }

    // get the scaled sketch
    var newStrokes = [];
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      var newPoints = [];
      for (var j = 0; j < points.length; j++) {
        var point = points[j];
        var x = ((point.x - xOffset) * scale) + xOffset;
        var y = ((point.y - yOffset) * scale) + yOffset;
        newPoints.push({x: x, y: y, time: point.time});
      }
      var newStroke = {points: newPoints};
      newStrokes.push(newStroke);
    }
    var newSketch = {strokes: newStrokes};

    // relocate scaled sketch to center of original sketch
    var newBox = this.calculateBoundingBox(newSketch);
    var moveX = box.centerX - newBox.centerX;
    var moveY = box.centerY - newBox.centerY;
    newSketch = this.translate(newSketch, moveX, moveY);

    return newSketch;
  },

  scaleSquare: function(sketch, size) {
    // get the bounding box
    var box = this.calculateBoundingBox(sketch);

    // get the scaled sketch
    var newStrokes = [];
    var strokes = sketch.strokes;
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      var newPoints = [];
      for (var j = 0; j < points.length; j++) {
        var point = points[j];
        var x = point.x * size / box.width;
        var y = point.y * size / box.height;
        newPoints.push({x: x, y: y, time: point.time});
      }
      var newStroke = {points: newPoints};
      newStrokes.push(newStroke);
    }
    var newSketch = {strokes: newStrokes};

    // relocate scaled sketch to center of original sketch
    var newBox = this.calculateBoundingBox(newSketch);
    var moveX = box.centerX - newBox.centerX;
    var moveY = box.centerY - newBox.centerY;
    newSketch = this.translate(newSketch, moveX, moveY);

    return newSketch;
  },
}; // end
