var mergesort = module.exports = function(array) {
    var len = array.length;

    if (len < 2) { 
      return array;
    }
    var pivot = Math.ceil(len/2);
    return merge(mergesort(array.slice(0,pivot)), mergesort(array.slice(pivot)));
};

function merge (left, right) {
    var result = [];
    
    while((left.length > 0) && (right.length > 0)) {
      if ( left[0].toLowerCase() > right[0].toLowerCase()) {
        result.push(right.shift());
      }
      else {
        result.push(left.shift());
      }
    }

    result = result.concat(left, right);
    return result;
};