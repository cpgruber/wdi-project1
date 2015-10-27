// try to have one global variable
var war = {
  buildDeck: function(){
    var cards = [2,3,4,5,6,7,8,9,10,11,12,13,14];
    var special = ['J','Q','K','A'];
    var suits = ['s','h','c','d'];
    var unicodes = {s:"\u2660",h:"\u2665",c:"\u2663",d:"\u2666"};
    var deckList = [];
    for (var i=0;i<cards.length;i++){
      for (var s=0;s<suits.length;s++){
        deckList.push({
          'value':cards[i],
          'suit':suits[s],
          'unicode':unicodes[suits[s]],
          'display':(cards[i]>10)?special[cards[i]-11]:cards[i]
        });
      }
    }
    return deckList;
  },
  buildComponents:function(){
    this.components.svg = d3.select('body').append('svg').attr('height',900).attr('width',1000);
    this.components.deck = this.components.svg.append('g').attr('id','deck');
    this.components.inPlay = this.components.svg.append('g').attr('id','inPlay');
    this.components.burnPile = this.components.svg.append('g').attr('id','burn');
    this.components.cardBG = this.components.svg.append('defs')
      .append('pattern').attr('id','cardBg').attr('patternUnits','userSpaceOnUse')
        .attr('width',100).attr('height',100)
      .append('image').attr('xlink:href','assets/skulls.png')
        .attr('x',0).attr('y',0).attr('width',100).attr('height',100);
  },
  components:{},
  buildCards:function(){
    var cards = this.components.deck.selectAll('.card').data(this.buildDeck())
      .enter().append('g').attr('class','card')
      .attr('suit', function(d){return d.suit})
      .attr('num',function(d){return d.value});

    cards.append('rect').attr('class','front');
    cards.append('text')
      .text(function(d){
        var uni = d.unicode;
        var number = d.display;
        return uni+number})
    cards.append('rect').attr('class','back').attr('fill','url(#cardBg)');
    return cards;
  },
  shuffle:function(){
    this.components.deck.selectAll('.card').sort(function(d){
      return 0.5-Math.random();
    })
  },
  dealDeck:function(players){
    this.players = players;
    this.components.stackG = this.components.svg.selectAll('.stack')
      .data(d3.range(players));
    this.components.stackG.enter().append('g')
      .attr('class',function(d,i){return 'stack p'+i});
    this.components.stackG.exit().remove();
    this.deal();
  },
  deal:function(){
    this.components.deck.selectAll('.card').each(function(d,i){
      var stackNum = i%2;

      d3.select(this).attr('stack',stackNum);

      //trying this in css transitions//
        // .transition().duration(300).delay(function() { return i * 50; })
        // .attr('transform',function(){
        //   var x = (i%2==0)?50:500;
        //   var y = 400;
        //   return 'translate('+x+','+y+')';
        // })

      var that = d3.select(this).remove();
      d3.select('.p'+stackNum).append(function(){
        return that.node();
      })
    })
  },
  getPlays:function (){
    var playArr = [];
    var inPlay = this.components.inPlay;

    //gotta get this in css animation//
    // play0.transition().duration(300)
    //   .attr('transform','translate(195,200)');
    //
    // play1.transition().duration(300)
    //   .attr('transform','translate(355,200)');
    //
    // d3.selectAll('.inPlay').selectAll('.front').transition().duration(500)
    //   .style('fill','white');
    // d3.selectAll('.inPlay').selectAll('.back').transition().duration(500)
    //   .style('opacity',0);

    var plays = this.components.stackG.each(function(d,i){
      var play = d3.select(this).select('.card').attr('class','card inPlay')
      var p = parseInt(play.attr('num'));
      playArr.push(p);

      var that = play.remove();
      inPlay.append(function(){
        return that.node();
      })

    });
    return playArr;
  }
}

war.buildComponents();
war.buildCards();
d3.select('#shuffle').on('click',function(){
  war.shuffle();
});
d3.select('#deal').on('click', function(){
  war.dealDeck(2);
});

// function getCards(){
//   //get the top card from each stack
//   var play0 = d3.select('.p0').select('.card').attr('class','card inPlay')
//   play0.transition().duration(300)
//     .attr('transform','translate(195,200)');
//
//   var play1 = d3.select('.p1').select('.card').attr('class','card inPlay')
//   play1.transition().duration(300)
//     .attr('transform','translate(355,200)');
//
//     var p1 = parseInt(play0.attr('num'));
//     var p2 = parseInt(play1.attr('num'));
//
//   d3.selectAll('.inPlay').selectAll('.front').transition().duration(500)
//     .style('fill','white');
//   d3.selectAll('.inPlay').selectAll('.back').transition().duration(500)
//     .style('opacity',0);
//   d3.selectAll('.inPlay').each(function(d,i){
//     var that = d3.select(this).remove();
//     inPlay.append(function(){
//       return that.node()
//     })
//   })
//   return [p1,p2];
// }

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
    burn(plays);
    return;
  }
  //move append contents of inPlay to winning stack
  inPlay.selectAll('.inPlay').attr('class','card').attr('stack',winner)
    .transition().duration(300).delay(function(d,i){return i*50})
    .attr('transform', function(){
      var x = (winner==0)?50:500;
      var y = 400;
      return 'translate('+x+','+y+')';
    })
    .each(function(d,i){
      var that = d3.select(this).remove();
      d3.select('.p'+winner).append(function(){
        return that.node();
      })
    }).select('.back').style('opacity',1)

  //if there's anything in the dump pile and there's a winner,
  //add contents of dump pile to winner's stack
  var dumpLen = burnPile.selectAll('.card')[0].length;
  if (dumpLen>0 && winner>=0){
    burnPile.selectAll('.card')
      .each(function(d,i){
        d3.select(this)
          .transition().duration(300).delay(function() { return 300 + (i * 50); })
          .attr('transform',function(){
            var x = (winner==0)?50:500;
            var y = 400;
            return 'translate('+x+','+y+')';
          })

        var that = d3.select(this).remove();
        d3.select('.p'+winner).append(function(){
          return that.node();
        })
      });
  }
  console.log(d3.select('.p0').selectAll('.card')[0].length,d3.select('.p1').selectAll('.card')[0].length);
}

function burn(plays){
  var burns = getBurnCounts();
  var dump1 = d3.select('.p0').selectAll('.card').filter(function(d,i){return i<burns[0]})
    .each(function(d,i){
      d3.select(this)
        .transition().duration(300).delay(function() { return 300 + (i * 50); })
        .attr('transform',function(){
          var x = 500;
          var y = 50;
          return 'translate('+x+','+y+')';
        })

      var that = d3.select(this).remove();
      burnPile.append(function(){
        return that.node();
      })
    });

  var dump2 = d3.select('.p1').selectAll('.card').filter(function(d,i){return i<burns[1]})
    .each(function(d,i){
      d3.select(this)
        .transition().duration(300).delay(function() { return 300 + (i * 50); })
        .attr('transform',function(){
          var x = 500;
          var y = 50;
          return 'translate('+x+','+y+')';
        })

      var that = d3.select(this).remove();
      burnPile.append(function(){
        return that.node();
      })
    });

  inPlay.selectAll('.inPlay').attr('class','card')
    .each(function(d,i){
      d3.select(this)
        .transition().duration(300).delay(function() { return 600+ (i * 50); })
        .attr('transform',function(){
          var x = 500;
          var y = 50;
          return 'translate('+x+','+y+')';
        }).select('.back').style('opacity',1)

      var that = d3.select(this).remove();
      burnPile.append(function(){
        return that.node();
      })
    });
}

function getBurnCounts(){
  //if you have fewer than three cards, returns the amount
  //each player can burn and still be able to play
  var burns = [];
  for (var i=0;i<stackG[0].length;i++){
    var stackLength = d3.select('.p'+i).selectAll('.card')[0].length;
    var burn = (stackLength>3)?3:stackLength - 1;
    burns.push(burn);
  }
  return burns;
}

function playRound(){
  var plays = getCards();
  play(plays);
}

function reset(){
  var cards = d3.selectAll('.card').each(function(d,i){
    d3.select(this)
      .transition().duration(300).delay(function() { return i * 50; })
      .attr('transform','translate(75,100)')

    var that = d3.select(this).remove();
    deck.append(function(){
      return that.node()
    })
  })
}

//d3.select('#play').on('click', playRound);

// d3.select('#reset').on('click',reset);
