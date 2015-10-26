var cards = [2,3,4,5,6,7,8,9,10,11,12,13,14];
var special = ['J','Q','K','A'];
var suits = ['s','h','c','d'];
var deckList = [];
var stacks = [];
var dump = [];
var pStacks;

var svg = d3.select('body').append('svg').attr('height',900).attr('width',1000).style('fill','none');
var deck = svg.append('g').attr('id','deck');
var inPlay = svg.append('g').attr('id','inPlay');
var burnPile = svg.append('g').attr('id','burn');

for (var i=0;i<cards.length;i++){
  for (var s=0;s<suits.length;s++){
    deckList.push({'value':cards[i],'suit':suits[s]});

  }
  deck.selectAll('.card').data(deckList).enter().append('rect').attr('class','card')
    .attr('d',function(d){
      return d.value + d.suit;
    })
    .attr('num', function(d){
      return d.value;
    })
    .style('fill','blue').style('height','200px').style('width','150px');
}

function shuffle(){
  deck.selectAll('.card').sort(function(d){
    return 0.5-Math.random();
  })
}

function dealDeck(players){
  //deal deck to X number of players;
  var stackG = svg.selectAll('.stack').data(d3.range(players)).enter().append('g')
    .attr('class',function(d,i){return 'stack p'+i})
  deal();
}

function deal(){
  deck.selectAll('.card').each(function(d,i){
    var stackNum = i%2;

    d3.select(this)
      .attr('stack',stackNum)
      .transition().duration(300).delay(function() { return i * 50; })
      .attr('transform',function(){
        var x = (i%2==0)?50:500;
        var y = 400;
        return 'translate('+x+','+y+')';
      })

    var that = d3.select(this).remove();
    d3.select('.p'+stackNum).append(function(){
      return that.node()
    })
  })
}

function getCards(){
  //get the top card from each stack
  var play0 = d3.select('.p0').select('.card').attr('class','card inPlay')

  play0.transition().duration(300)
    .attr('transform','translate(200,200)');

  var play1 = d3.select('.p1').select('.card').attr('class','card inPlay')

  play1.transition().duration(300)
    .attr('transform','translate(350,200)');

    var p1 = parseInt(play0.attr('num'));
    var p2 = parseInt(play1.attr('num'));

  d3.selectAll('.inPlay').each(function(d,i){
    var that = d3.select(this).remove();
    inPlay.append(function(){
      return that.node()
    })
  })
  return [p1,p2];
}

function play(plays){
  var p1 = plays[0];
  var p2 = plays[1];
  var winner;
  //compare results of getCards(). If one is greater than the other, add to
  //end of winning stack
  if (p1 > p2){
    winner = 0;
  }else if(p2 > p1){
    winner = 1;
  }else{
    //if there's a tie, the cards played and three more cards each get added to the dump pile
    //play again to see who gets them
    //burn(plays);
    return;
  }
  //move append contents of inPlay to winning stack
  inPlay.selectAll('.inPlay').attr('class','card').attr('stack',winner)
    .transition().duration(500).delay(function(){return i*50})
    .attr('transform', function(){
      var x = (winner==0)?50:500;
      var y = 400;
      return 'translate('+x+','+y+')';
    })
    .each("end",function(d,i){
      var that = d3.select(this).remove();
      d3.select('.p'+winner).append(function(){
        return that.node();
      })
    })

    console.log(document.querySelector('.p0').children.length,document.querySelector('.p1').children.length,
    d3.selectAll('.card')[0].length);

  //if there's anything in the dump pile and there's a winner,
  //add contents of dump pile to winner's stack
  // if (dump.length>0 && winner){
  //   while (dump.length>0){
  //     stacks[winner].stack.push(dump.pop());
  //     pStacks[winner].appendChild(burnPile.children[0]);
  //   }
  // }
}

shuffle()
shuffle()
shuffle()
dealDeck(2);



/*
// var burnPile = document.getElementById('burn');
// var inPlay = document.getElementById('inPlay');
// var deck = document.getElementById('deck');

// var card = document.createElement('div');
// card.className = 'card';
// deck.appendChild(card);

function shuffle(){
  //randomly places cards in front or behind one another;
  deckList.sort(function(){
    return 0.5 - Math.random();
  })
}

function dealDeck(players){
  //deal deck to X number of players;
  var stackLength = deckList.length/players;
  for (var i=0;i<players;i++){
    var stack = {'player':i,'stack':[]};
    stacks.push(stack);

    var pStack = document.createElement('div');
    pStack.className = 'stack contain';
    document.body.appendChild(pStack);
  }
  for (var i=0;i<stackLength;i++){
    for (var s=0;s<stacks.length;s++){
      stacks[s].stack.push(deckList.pop());
    }
  }
  deal();
}

function deal(){
  //deal actual cards to each stack
  var childCount = deck.childElementCount;
  pStacks = document.querySelectorAll('.stack');
  while (childCount > 0){
    for (var b=0;b<pStacks.length;b++){
      pStacks[b].appendChild(deck.children[0]);
    }
    childCount = deck.childElementCount;
  }
}

function getCards(){
  //get the top card from each stack
  var p1 = stacks[0].stack.splice(0,1)[0];
  var p2 = stacks[1].stack.splice(0,1)[0];

  for (var b=0;b<pStacks.length;b++){
    inPlay.appendChild(pStacks[b].children[0]);
  }

  return [p1,p2];
}

function play(plays){
  var p1 = plays[0];
  var p2 = plays[1];
  var winner;
  //compare results of getCards(). If one is greater than the other, add to
  //end of winning stack
  if (p1.value > p2.value){
    stacks[0].stack.push(p1);
    stacks[0].stack.push(p2);
    winner = 0;
  }else if(p2.value > p1.value){
    stacks[1].stack.push(p1);
    stacks[1].stack.push(p2);
    winner = 1;
  }else{
    //if there's a tie, the cards played and three more cards each get added to the dump pile
    //play again to see who gets them
    burn(plays);
    return;
  }

  //move append contents of inPlay to winning stack
  pStacks[winner].appendChild(inPlay.children[0]);
  pStacks[winner].appendChild(inPlay.children[0]);

  //if there's anything in the dump pile and there's a winner,
  //add contents of dump pile to winner's stack
  if (dump.length>0 && winner){
    while (dump.length>0){
      stacks[winner].stack.push(dump.pop());
      pStacks[winner].appendChild(burnPile.children[0]);
    }
  }
}

function burn(plays){
  var burns = getBurnCounts();
  //remove cards to burn into theseBurns array
  var dump1 = stacks[0].stack.splice(0,burns[0]);
  var dump2 = stacks[1].stack.splice(0,burns[1]);
  var theseBurns = plays.concat(dump1,dump2);
  //if nothing in dump, make dump = theseBurns, else add theseBurns to existing dump
  dump = (dump.length == 0)?theseBurns:dump.concat(theseBurns);

  for (var i=0;i<burns.length;i++){
    for (var b=0;b<burns[i];b++){
      burnPile.appendChild(pStacks[i].children[0]);
    }
  }
  //put cards in inPlay into burnPile
  burnPile.appendChild(inPlay.children[0]);
  burnPile.appendChild(inPlay.children[0]);
}

function getBurnCounts(){
  //if you have fewer than three cards, returns the amount
  //each player can burn and still be able to play
  var burns = [];
  for (var i=0;i<stacks.length;i++){
    var burn = (stacks[i].stack.length>3)?3:stacks[i].stack.length - 1;
    burns.push(burn)
  }
  return burns;
}
*/
