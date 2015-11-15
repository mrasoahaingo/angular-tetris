var app = angular.module('tetrisApp', []);

app.filter('reverse', function() {
   return function(items) {
      return items.slice().reverse();
   };
});

app.controller('TetrisCtrl', ['$scope', '$timeout', '$q',
   function($scope, $timeout, $q) {

      var elements = [{
            name: 'O',
            matrix: [
               [
                  [1, 1],
                  [1, 1]
               ]
            ]
         },
         {
            name: 'I',
            matrix: [
               [
                  [1, 1, 1, 1]
               ],
               [
                  [1],
                  [1],
                  [1],
                  [1]
               ]
            ]
         },
         {
            name: 'L',
            matrix: [
               [
                  [0, 0, 1],
                  [1, 1, 1]
               ],
               [
                  [1, 0],
                  [1, 0],
                  [1, 1]
               ],
               [
                  [1, 1, 1],
                  [1, 0, 0]
               ],
               [
                  [1, 1],
                  [0, 1],
                  [0, 1]
               ]
            ]
         },
         {
            name: 'J',
            matrix: [
               [
                  [1, 1, 1],
                  [0, 0, 1]
               ],
               [
                  [0, 1],
                  [0, 1],
                  [1, 1]
               ],
               [
                  [1, 0, 0],
                  [1, 1, 1]
               ],
               [
                  [1, 1],
                  [1, 0],
                  [1, 0]
               ]
            ]
         },
         {
            name: 'S',
            matrix: [
               [
                  [0, 1, 1],
                  [1, 1, 0]
               ],
               [
                  [1, 0],
                  [1, 1],
                  [0, 1]
               ]
            ]
         },
         {
            name: 'Z',
            matrix: [
               [
                  [1, 1, 0],
                  [0, 1, 1]
               ],
               [
                  [0, 1],
                  [1, 1],
                  [1, 0]
               ]
            ]
         },
         {
            name: 'T',
            matrix: [
               [
                  [1, 1, 1],
                  [0, 1, 0]
               ],
               [
                  [0, 1],
                  [1, 1],
                  [0, 1]
               ],
               [
                  [0, 1, 0],
                  [1, 1, 1]
               ],
               [
                  [1, 0],
                  [1, 1],
                  [1, 0]
               ]
            ]
         }
      ],
         figure = 0,
         moves = 0,
         rows = 20,
         cols = 10,
         size = 30,
         nb = rows * cols,
         step = 1,
         timer,
         current,
         next,
         lines = [],
         lock = false,

         clearElement = function(element) {
            var deferred = $q.defer();

            element.class_name = null;
            element.empty = true;

            drawElement(element).then(function() {
               deferred.resolve();
            });

            return deferred.promise;
         },

         getElement = function(fig) {
            var el = elements[fig || Math.floor(Math.random() * elements.length)];
            el.x = Math.ceil(cols / 2) - Math.floor(el.matrix[figure].length / 2);
            el.y = rows - 1;
            el.class_name = el.name;
            return el;
         },

         getFigure = function(element, i) {
            return element.matrix[i || 0];
         },

         getNextElement = function(element) {
            var cells = [],
               shape = getFigure(element, 0),
               x,
               y = shape.length - 1;
               
            for (y; y >= 0; y--) {
               cells[y] = [];
               for (x = shape[y].length - 1; x >= 0; x--) {
                  cells[y][x] = {
                     class_name: shape[y][x] ? element.name : 'transparent'
                  }
               }
            }
               
            return cells;
         },

         drawElement = function(element, base) {
            var grid = base || $scope.cells,
               cell,
               shape = getFigure(element, figure),
               x,
               y = shape.length - 1,
               deferred = $q.defer();
               
            for (y; y >= 0; y--) {
               for (x = shape[y].length - 1; x >= 0; x--) {
                  if (shape[y][x] == 1) {
                     cell = grid[element.y - y][element.x + x];
                     cell.class_name = element.class_name;
                     cell.empty = element.empty;
                  }
               }
            }

            deferred.resolve(element);

            return deferred.promise;
         },

         drawGrid = function() {
            var y = rows - 1,
               x
               cells = [];
            for (y; y >= 0; y--) {
               cells[y] = [];
               for (x = 0; x < cols; x++) {
                  cells[y].push({
                     empty: true
                  });
               }
            }
            
            $scope.cells = cells;
         },

         refreshGrid = function(grid) {
            var g = 0, c = 0, cells = [], nb_bloc = [], x;
            
            while(c < rows) {
               if(grid[g] && grid[g].length == cols) {
                  cells[c] = grid[g];
                  nb_bloc[c] = lines[g];
                  c++;
               }
               
               if(g < rows) {
                  g++;
               }
               else {
                  cells[c] = [];
                  nb_bloc[c] = 0;
                  for (x = 0; x < cols; x++) {
                     cells[c].push({
                        empty: true
                     });
                  }
                  c++;
               }
            }  
            lines = nb_bloc;
            $scope.cells = cells;
         
         },
   
         moveElement = function(direction) {
            var offset = [0, 0],
               element, move = true;

            if(lock) {
              return false;
            }
            
            lock = true;

            clearElement(current).then(function() {
              
              element = {
                 name: current.name,
                 class_name: current.name,
                 x: current.x,
                 y: current.y,
                 matrix: current.matrix
              };
  
              switch (direction) {
                 case 'fall':
                    offset = [0, fallTo(element)];
                    break;
                 case 'left':
                    offset = canMoveTo(element, [-1, 0]) ? [-1, 0] : offset;
                    break;
                 case 'right':
                    offset = canMoveTo(element, [1, 0]) ? [1, 0] : offset;
                    break;
                 case 'down':
                    offset = canMoveTo(element, [0, -1]) ? [0, -1] : move = false;
                    break;
                 case 'rotate':
                    figure = canMoveTo(element, offset, (figure + 1) % element.matrix.length) ? (figure + 1) % element.matrix.length : figure;
                    break;
                 default:
                    break;
              }
  
              if (move) {
                 moves++;
                 element.x += offset[0];
                 element.y += offset[1];
                 drawElement(element).then(function(el) {
                    current = el;
                 });
              } else {
                 archiveElement(element);
                 startNewElement();
              }
              
              lock = false;
              
            });

         },

         fallTo = function(element) {
           var y = 0;
           
           while(canMoveTo(element, [0, y])) {
              y--;
           }
           
           return y + 1; 
         },

         endGame = function() {
           $scope.show_msg = true;
            $scope.msg = 'Game Over';
            $timeout.cancel(timer);
         },

         archiveElement = function(element) {
            var ex = element.x,
               ey = element.y,
               shape = getFigure(element, figure),
               x,
               y = shape.length - 1,
               remove = [];
               
            for (y; y >= 0; y--) {
               for (x = shape[y].length - 1; x >= 0; x--) {
                  if (shape[y][x] == 1) {
                     $scope.cells[ey - y][ex + x].class_name = 'archive';
                     $scope.cells[ey - y][ex + x].empty = false;

                     if (checkLine(ey - y)) {
                        remove.push(ey - y);
                     }
                  }
               }
            }
            
            $scope.score++;
            
            if (remove.length > 0) {
               removeLine(remove);
               refreshGrid($scope.cells);
            }
         },

         removeLine = function(list) {
            var new_line = [],
               i;

            for (i = 0; i < cols; i++) {
               new_line.push({
                  empty: true
               });
            }

            for (i = 0; i < list.length; i++) {
               lines[list[i]] = 0;
               $scope.cells[list[i]] = [];
               $scope.score+=2;
               $scope.lines++;
            }
         },

         checkLine = function(i) {
            lines[i] = lines[i] ? lines[i] + 1 : 1;
            if (lines[i] == cols) {
               return true;
            }
            return false;
         },

         canMoveTo = function(element, offset, fig) {
               
            if(fig === undefined) {
               fig = figure;
            }
            
            var ex = element.x + offset[0],
               ey = element.y + offset[1],
               shape = getFigure(element, fig),
               x,
               y = shape.length - 1,
               nb_ok = 0,
               nb_point = 0;
               
            for (y; y >= 0; y--) {
               for (x = shape[y].length - 1; x >= 0; x--) {
                  if (shape[y][x] == 1) {
                     nb_point++;
                     nb_ok += $scope.cells[ey - y] && $scope.cells[ey - y][ex + x] && $scope.cells[ey - y][ex + x].empty === true ? 1 : 0;
                  }
               }
            }
            
            return nb_ok == nb_point;
         },

         fallDown = function() {
            $timeout.cancel(timer);
            timer = $timeout(function() {
               moveElement('down');
               if (canFallDown()) {
                  fallDown();
               }
            }, 500);
         },

         canFallDown = function() {
            return step--;
         },

         startGame = function() {
            $timeout.cancel(timer);
            $scope.next_grid = [];
            $scope.cells = [];
            $scope.level = 1;
            $scope.score = 0;
            $scope.lines = 0;
            $scope.show_msg = false;
            lines = [],
            lock = false,
            drawGrid();
            startNewElement();
         },

         startNewElement = function() {
            $timeout.cancel(timer);
            step = rows;
            moves = 0;
            figure = 0;
            
            current = next || getElement();
            next = getElement();
            
            $scope.next_figure = getNextElement(next, 0);
            
            if (canMoveTo(current, [0, 0])) {
               drawElement(current).then(function(el) {
                  current = el;
               });
               fallDown();
            } else {
               endGame();
            }
         };
      
      $scope.size = size;
      $scope.cols = cols;
      $scope.rows = rows;

      $scope.new_game = startGame;

      startGame();

      $(window).keyup(function(e) {
         switch (e.keyCode) {
            case 32:
               moveElement('fall');
               break;
            case 38:
               moveElement('rotate');
               break;
            case 37:
               moveElement('left');
               break;
            case 39:
               moveElement('right');
               break;
            case 40:
               moveElement('down');
               break;
            default:
               break;
         }
      });

   }
]);