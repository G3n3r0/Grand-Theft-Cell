window.onload = function() {
    var FPS = 30;
    function E(a, b) {
        return !(
            ((a.y + a.height) < (b.y)) ||
            (a.y > (b.y + b.height)) ||
            ((a.x + a.width) < b.x) ||
            (a.x > (b.x + b.width))
        );
    }
    
    var paper = new Raphael(document.getElementById("svgCont"), papW, papH);
    paper.canvas.id="svgCanvas";
    window.scrollTo(0,1);
    
    function Entity(x,y,width,height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    function Player(x, y) {
        Entity.call(this,x,y,64,64);
    }
    Player.prototype = new Entity();
    Player.prototype.rect = null;
    Player.prototype.draw = function() {
        
    };
    
    function Platform(x, y) {
        Entity.call(this,x,y,64,64);
    }
    Platform.prototype = new Entity();
    
    function init() {
    }
};