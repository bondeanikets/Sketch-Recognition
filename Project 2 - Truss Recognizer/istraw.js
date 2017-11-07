/**
 * IMPORTANT: Must provide an already-resampled sketch to this code.
 */
var IStraw = {

  /**
   * Runs the IStraw algorithm on (an already-resampled) sketch.
   * @param {Sketch} sketch - The input resampled sketch.
   * @return {number[][]} The array of array of corner indices.
   */
  run: function(sketch) {
      console.log("sketch is ")
      console.log(sketch)
    var strokes = sketch.strokes;
    var sketchCorners = [];
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      var strokeCorners = this.main(points);

      sketchCorners.push(strokeCorners);
    }

    return sketchCorners;
  },

  /**
   * Run the IStraw algorithm on points from a single stroke.
   * @param {Point[]} points - The target points.
   * @return {number[]} The resampled corner indices.
   */
  main: function(points) {

    // get the corners (line 3)
    var corners = this.getCorners(points);

    return corners;
  },

  /**
   * Get the corners.
   * @param {Point[]} points - The target resampled points.
   * @return {number[]} The corner indices.
   */
  getCorners: function(points) {
    // initialize array of corner indices (line 1)
    var corners = [];

    // add the 0-index to the corner indices (line 2)
    corners.push(0);

    // handle singleton-stroke case
    if (points.length === 1) { return corners; }
    if (points.length < 6 && points.length > 1){
        corners.push(corners.length-1)
        return corners
    }

    // set the window length (line 3)
    var W = 3;

    // zero-fill the array of straw distances to the size of points
    var straws = new Array(points.length - 1).fill(0);

    // set the straw distances for the points outside the window (line 4, 5, 6, 7)
//    console.log("passing line 61")
//      console.log(points[1+W])
//      console.log(1+W)
//      console.log(points.length)
      
    if (points.length >= 6) {
        straws[1] = this.distance(points[0], points[1 + W]) * ((2 * W) / (1 + W));
        straws[2] = this.distance(points[0], points[2 + W]) * ((2 * W) / (2 + W));
        straws[points.length - 2] = ((2 * W) / (1 + W)) * this.distance(points[points.length - 1], points[points.length - 2 - W]);
        straws[points.length - 3] = ((2 * W) / (2 + W)) * this.distance(points[points.length - 1], points[points.length - 3 - W]);

        // set the straw distances for the points inside the window (line 8, 9)
        for (var i = W; i < points.length - W; i++) {
          straws[i] = this.distance(points[i - W], points[i + W]);
        }

        corners = this.initCorners(points, corners, straws, W);
        corners = this.polylineProc(points, corners, straws);
        corners = this.curveProcessPass1(points, corners);
        corners = this.curveProcessPass2(points, corners);

        return corners;
    }  
    
  },

  initCorners: function(points, corners, straws, W) {
    // debug
    if (this.isDebug) {
      console.log("----- 1. initCorners -----");
      console.log("   before (" + corners.length + "): " + this.debugCorners(corners));
    }
    // end debug

    // get the pseudo-mean (line 1)
    var t = this.mean(straws.slice(1, straws.length)) * 0.95;

    // (line 2)
    for (var i = W; i < points.length - W - 1; i++) {
      if (straws[i] < t) {
        var localMin = straws[i];
        var localMinIndex = i;
        while (i < points.length - W && straws[i] < t) {
          if (straws[i] < localMin) {
            localMin = straws[i];
            localMinIndex = i;
          }
          i++;
        }
        corners.push(localMinIndex);
      }
    }

    // (line 12)
    corners.push(points.length - 1);

    // get the array of point times
    var times = [];
    points.forEach(function(point){
      times.push(point.time);
    });

    // (line 13)
    var meanTime = this.mean(times);

    // (line 14)
    for (var i = 1; i < corners.length - 1; i++) {

      // (lines 15, 16)
      var c1 = corners[i - 1];
      var c2 = corners[i];

      // (line 17)
      if (c2 - c1 >= 6) {
        // (line 18, 19)
        var localMaxIndex = c1 + 3;
        var localMax = points[localMaxIndex].time;

        // (line 20)
        for (var j = c1 + 3; j <= c2 - 3; j++) {
          // (line 21)
          if (localMax < points[j].time) {
            localMax = points[j].time;
            localMaxIndex = j;
          }
          if (localMax > 2 * meanTime) {
            corners.slice(i, 0, localMinIndex);
          }
        }
      }
    }

    // debug
    if (this.isDebug) {
      console.log("    after (" + corners.length + "): " + this.debugCorners(corners));
      console.log("----- end initCorners -----")
    }
    // end debug

    // (line 25)
    return corners;
  },

  curveProcessPass2: function(points, corners) {
    // debug
    if (this.isDebug) {
      console.log("----- 7. curveProcessPass2 -----");
      console.log("   before (" + corners.length + "): " + this.debugCorners(corners));
    }
    // end debug

    for (var i = 1; i < corners.length - 1; i++) {
      var angles = this.compAngles2(points, corners, i);
      var notCorner = false;

      if
      (
        (angles[2] > 26.1 + 0.93*angles[1] && ((angles[3] > 31 + angles[1] && angles[3] > 100) || angles[3] > 161))
        ||
        (angles[0] === 0 && angles[2] - angles[1] > 15 && angles[3] > 20)
      )
      {
        notCorner = true;
        if (notCorner || angles[0] > 0) {
          corners.splice(i, 1);
          i--;
        }
      }
    }

    // debug
    if (this.isDebug) {
      console.log("    after (" + corners.length + "): " + this.debugCorners(corners));
      console.log("----- end curveProcessPass2 -----");
    }
    // end debug

    return corners;
  },

  compAngles2: function(points, corners, i) {
    var a0 = 0;
    var a1 = 0;
    var a2 = 0;
    var a3 = 0;

    var c = corners[i];
    var pos = points[c];
    var s0 = c - 12;
    if (s0 < corners[i - 1]) {
      s0 = corners[i - 1];
    }
    var e0 = c + 12;
    if (e0 > corners[i + 1]) {
      e0 = corners[i + 1];
    }
    var s1 = c - Math.ceil( (corners[i] - s0) / 3 );
    var e1 = c - Math.ceil( (corners[i] - e0) / 3 );
    var a3 = this.getAngle(pos, points[c - 1], points[c + 1]);
    if (this.diffDir(points, c, s0, e0, s1, e1)) {
      s0 = c - 4;
      e0 = c + 4;
      if (s0 < corners[i - 1]) {
        s0 = corners[i - 1];
      }
      if (e0 > corners[i + 1]) {
        e0 = corners[i + 1];
      }
      s1 = c - 1;
      e1 = c + 1;
      var a0;
      if (this.diffDir(points, c, s0, e0, s1, e1)) {
        a0 = -1;
        return [a0, a1, a2, a3];
      }
      a0 = 0;
    }
    else if ( !this.isLine(points, c, corners[i - 1], 0.975)
      && !this.isLine(points, c, corners[i + 1], 0.975) )  {
      if (this.diffDir(points, c, s0, s1, e1, e0) && a3 > 135 ) {
        a0 = 1;
      }
    }
    a1 = this.getAngle(pos, points[s0], points[e0]);
    a2 = this.getAngle(pos, points[s1], points[e1]);
    return [a0, a1, a2, a3];
  },

  curveProcessPass1: function(points, corners) {
    // debug
    if (this.isDebug) {
      console.log("----- 6. curveProcessPass1 -----");
      console.log("   before (" + corners.length + "): " + this.debugCorners(corners));
    }
    // end debug

    var preCorner = corners[0];

    for (var i = 1; i < corners.length - 1; i++) {
      var angles = this.compAngles1(points, corners, i);
      preCorner = corners[i];
      var notCorner = this.notCorner1(angles, corners, i);
      if (notCorner) {
        corners.splice(i, 1);
        i--;
      }
    }

    // debug
    if (this.isDebug) {
      console.log("    after (" + corners.length + "): " + this.debugCorners(corners));
      console.log("----- end curveProcessPass1 -----");
    }
    // end debug

    return corners;
  },

  notCorner1: function(angles, corners, i) {
    if (angles[3] > 161) {
      return true;
    }
    if ( (angles[2] > 36 + 0.85*angles[1]) && (angles[1] > 20) && (angles[3] > 80 + 0.55*angles[1]) ) {
      return true;
    }
    if ( (corners[i] - corners[i - 1] < 3 || corners[i + 1] - corners[i] < 3) && (angles[2] > 130) ) {
      return true;
    }
    return false;
  },

  compAngles1: function(points, corners, i) {
    var c = corners[i];
    var pos = points[c];
    var s = c - 12;
    if (s < corners[i - 1]) {
      s = corners[i - 1];
    }
    var e = c + 12;
    if (e > corners[i + 1]) {
      e = corners[i + 1];
    }
    var a1 = this.getAngle(pos, points[s], points[e]);
    s = corners[i] - Math.ceil( (c - s) / 3 );
    e = corners[i] - Math.ceil( (c - e) / 3 );
    var a2 = this.getAngle(pos, points[s], points[e]);
    var a3 = this.getAngle(pos, points[c - 1], points[c + 1]);
    if ( (c - corners[i - 1]) > 6 ) {
      a3 = this.getAngle(pos, points[c - 2], points[c + 1]);
    }
    if ( (corners[i + 1] - c) > 6 ) {
      a3 = this.getAngle(pos, points[c - 1], points[c + 2]);
    }

    var a = [0, a1, a2, a3];
    return a;
  },

  polylineProc: function(points, corners, straws) {

    // debug
    if (this.isDebug) {
      console.log("----- 2. polylineProc -----");
      console.log("   before (" + corners.length + "): " + this.debugCorners(corners));
    }
    // end debug

    // initialize the leave condition to on
    var loop = true;

    // keep searching for halfway corners until no more can be found
    while (loop) {

      // tentatively set the loop condition to off
      loop = false;

      // search for halfway corners between consecutive corner pairs
      for (var i = 1; i < corners.length; i++) {

        // get the consecutive corner pairs
        var c1 = corners[i - 1];
        var c2 = corners[i];

        // check if a proper line exists between the consecutive corner pair
        var isLine = this.isLine(points, c1, c2, 0.975);

        // the path between consecutive corner pair does not form a line
        // ==> insert a corner in-between the pair
        if (!isLine) {

          // create the halfway corner
          var newC = this.halfwayCorners(straws, c1, c2);

          // insert the new corner in-between the consecutive corner pairs
          corners.slice(newC, 0, i);

          // with a new corner added, the halfway corner search has to be re-started
          // ===> when this for-loop ends, restart the for-loop once more
          //leave = false;
        }

      }

    }

    // debug
    if (this.isDebug) {
      console.log("    after (" + corners.length + "): " + this.debugCorners(corners));
      console.log("----- end polylineProc -----");
    }
    // end debug

    corners = this.adjustCorners(points, corners);
    corners = this.tripletCollinearTest(points, corners);
    corners = this.shapeNoiseProcess(points, corners,);

    return corners;
  },

  shapeNoiseProcess: function(points, corners, straws) {
    if (this.isDebug) {
      console.log("----- 5. shapeNoiseProcess -----");
      console.log("   before (" + corners.length + "): " + this.debugCorners(corners));
    }

    for (var i = 1; i < corners.length; i++) {
      var c1 = corners[i - 1];
      var c2 = corners[i];
      if ( (c2 - c1 <= 1) || ( (c2 - c1 <= 2) && (i === 0 && i === corners.length - 2) ) ) {
        // console.log("c1: " + c1);
        // console.log("c2: " + c2);
        if (straws[c1] < straws[c2]) {
          corners.splice(c2, 1);
        }
        else {
          corners.splice(c1, 1);
        }
        i--;
      }
    }

    if (this.isDebug) {
      console.log("    after (" + corners.length + "): " + this.debugCorners(corners));
      console.log("----- end shapeNoiseProcess -----");
    }

    return corners;
  },

  tripletCollinearTest: function(points, corners) {
    // debug
    if (this.isDebug) {
      console.log("----- 4. tripletCollinearTest -----");
      console.log("   before (" + corners.length + "): " + this.debugCorners(corners));
    }
    // end debug

    for (var i = 1; i < corners.length - 1; i++) {
      var c1 = corners[i - 1];
      var c2 = corners[i + 1];
      if (this.isLine(points, c1, c2, 0.988)) {
        console.log("triplet collinear test: !!!");
        corners.splice(i, 1);
        i = i - 1;
      }
    }

    var times = []
    points.forEach(function(point) {
      times.push(point);
    });
    var meanTime = this.mean(times);
    for (var i = 1; i < corners.length - 1; i++) {
      var c = corners[i];
      var c1 = corners[i - 1];
      var c2 = corners[i + 1];
      var threshold = 0.9747;
      if (c2 - c1 > 10) {
        threshold = threshold + 0.0053;
      }
      if ( (points[c].time > 2 * meanTime) || (points[c - 1].time > 2 * meanTime) || (points[c + 1].time > 2 * meanTime) ) {
        threshold = threshold + 0.0066;
      }
      if (this.isLine(points, c1, c2, threshold)) {
        corners.splice(i, 1);
        i = i - 1;
      }
    }

    // debug
    if (this.isDebug) {
      console.log("    after (" + corners.length + "): " + this.debugCorners(corners));
      console.log("----- end tripletCollinearTest -----");
    }
    // end debug

    return corners;
  },

  adjustCorners: function(points, corners) {
    // debug
    if (this.isDebug) {
      console.log("----- 3. adjustCorners -----");
      console.log("   before (" + corners.length + "): " + this.debugCorners(corners));
    }
    // end debug

    for (var i = 1; i < corners -2; i++) {
      var index = corners[i];
      if (index > 2 && index < points.length - 3) {
        var pos = [];
        var angle = [];
        for (var j = 0; j <= 6; j++) {
          pos.push(points[index - 3 + j]);
        }
        for (var j = 0; j <= 4; j++) {
          angle.push(this.getAngle(pos[j + 1], pos[j],  pos[j + 2]));
        }
        if (angle[1] < angle[3]) {
          if (angle[0] < angle[1] && angle[0] < angle[2]) {
            index = index - 2;
          }
          else if (angle[1] < angle[2]) {
            index = index - 1;
          }
        }
        else {
          if (angle[4] < angle3 && angle[4] < angle[2]) {
            index = index + 2;
          }
          else if (angle[3] < angle[2]) {
            index++;
          }
        }
        corner[i] = index;
      }
    }

    // debug
    if (this.isDebug) {
      console.log("    after (" + corners.length + "): " + this.debugCorners(corners));
      console.log("----- end adjustCorners -----");
    }
    // end debug

    return corners;
  },

  getAngle: function(center, start, end) {
    var theAngle;
    // get two vector of the angle
    var direction1 = {x: start.x - center.x, y: start.y - center.y};
    direction1 = this.normalize(direction1);
    var direction2 = {x: end.x - center.x, y: end.y - center.y};
    direction2 = this.normalize(direction2);
    //compute the angle
    theAngle = Math.acos(direction1.x * direction2.x + direction1.y * direction2.y);
    return theAngle * 180 / Math.PI;
  },

  normalize: function(point) {
    var a = point.x;
    var b = point.y;

    var v = Math.sqrt((a * a) + (b * b));
    var u = {x: (a / v), y: (b / v)};

    return u;
  },

  halfwayCorners: function(straws, a, b) {
    var quarter = Math.floor((b - a) / 4);
    var minValue = Number.MAX_SAFE_INTEGER;
    var minIndex = a + quarter;
    for (var i = a + quarter; i < b - quarter; i++) {
      if (straws[i] < minValue) {
        minValue = straws[i];
        minIndex = i;
      }
    }
    return minIndex;
  },

  isLine: function(points, a, b, threshold) {
    var distance = this.distance(points[a], points[b]);
    var pathDistance = this.pathDistance(points, a, b);
    return (distance / pathDistance) > threshold;
  },

  diffDir: function(points, o, a, b, c, d) {
    var d0 = {x: points[a].x - points[o].x, y: points[a].y - points[o].y};
    var d1 = {x: points[o].x - points[b].x, y: points[o].y - points[b].y};
    var d2 = {x: points[c].x - points[o].x, y: points[c].y - points[o].y};
    var d3 = {x: points[o].x - points[d].x, y: points[o].y - points[d].y};
    var cross0 = (d0.x * d1.y) - (d0.y * d1.x);
    var cross1 = (d2.x * d3.y) - (d2.y * d3.x);
    var result = cross0 * cross1;
    return result > 0;
  },

  pathDistance: function(points, a, b) {
    var d = 0;
    for (var i = a; i < b; i++) {
      d += this.distance(points[i], points[i + 1]);
    }
    return d;
  },

  /**
    * Calculate the distance between two input points.
    * @param {Point} p0 - The first target point.
    * @param {Point} p1 - The first target point.
    * @return {number} The Euclidean distance between two points.
    */
  distance: function(p0, p1) {
    var deltaX = p1.x - p0.x;
    var deltaY = p1.y - p0.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  },

  mean: function(values) {
    var sum = 0;
    values.forEach(function(value) {
      sum += value;
    });
    return sum / values.length;
  },

  debugCorners: function(corners) {
    var output = "";
    for (var i = 0; i < corners.length; i++) {
      output += corners[i];
      if (i !== corners.length - 1) { output += ", "; }
    }

    return output;
  },

  isDebug: true,
};
