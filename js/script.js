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
    this.components.svg = d3.select('body').append('svg').attr('height',600).attr('width',900);
    this.components.graph = this.components.svg.append('g').attr('id','graph');
    this.components.deck = this.components.svg.append('g').attr('id','deck');
    this.components.inPlay = this.components.svg.append('g').attr('id','inPlay');
    this.components.burnPile = this.components.svg.append('g').attr('id','burn');
    this.components.cardBG = this.components.svg.append('defs')
      .append('pattern').attr('id','cardBg').attr('patternUnits','userSpaceOnUse')
        .attr('width',100).attr('height',100)
      .append('image').attr('xlink:href','assets/skulls.png')
        .attr('x',0).attr('y',0).attr('width',100).attr('height',100);
    this.initGraph();
  },
  initGraph:function(players){
    this.components.singleGen = d3.svg.line().x(function(d){return 450+((26-d)*10)})
       .y(function(d,i){return 50+(i*125)}).interpolate('cardinal');
    var lineGen = this.components.singleGen;
    this.components.winnerLines = this.components.graph.selectAll('.winLine').data([0,52]).enter()
      .append('path').attr('class','winLine')
      .attr('d',function(d){return lineGen([d,d,d])});
    this.components.singleLine = this.components.graph.selectAll('.line').data(d3.range(1)).enter()
      .append('path').attr('class','line');
    this.components.scores = this.components.graph.selectAll('.score').data(d3.range(2)).enter()
      .append('text').attr('class','score');
    this.components.playCount = this.components.graph.selectAll('.counter').data(d3.range(1)).enter()
      .append('text').attr('class','counter');

    this.vizualize([26,26]);
  },
  components:{},
  counts:[[26],[26]],
  plays:0,
  interval:null,
  buildCards:function(){
    var cards = this.components.deck.selectAll('.card').data(this.yates(this.buildDeck()))
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
    this.components.deck.selectAll('.card').remove();
    this.buildCards();
    this.components.deck.selectAll('.card').each(function(d,i){
      d3.select(this).transition().delay(50*i).attr('class','card shuffling');
      d3.select(this).transition().delay((50*i)+300).attr('class','card');
    })
  },
  yates:function(array){
    var m = array.length, t, i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
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
    var players = this.players;
    this.components.deck.selectAll('.card').each(function(d,i){
      var stackNum = i%players;
      d3.select(this).transition().delay(50*i).attr('stack',stackNum);
      var that = d3.select(this).remove();
      d3.select('.p'+stackNum).append(function(){
        return that.node();
      })
    })
  },
  getPlays:function (){
    var playArr = [];
    var inPlay = this.components.inPlay;
    var plays = this.components.stackG.each(function(d,i){
      var play = d3.select(this).select('.card')
      var p = parseInt(play.attr('num'));
      play.transition().delay(200).attr('class','card inPlay');
      playArr.push(p);

      var that = play.remove();
      inPlay.append(function(){
        return that.node();
      })
    });
    return playArr;
  },
  playHand: function(plays){
    this.plays++;
    var winner;
    if (plays[0]>plays[1]){
      winner = 0;
    }else if (plays[1]>plays[0]){
      winner = 1;
    }else{
      this.burn(plays);
      return;
    }
    this.giveWinner(winner);
    var burnLength = this.components.burnPile.selectAll('.card')[0].length;
    if (burnLength>0){
      this.giveWinnerBurn(winner);
    }
    this.getScores();
  },
  getScores:function(){
    var p0score = d3.select('.p0').selectAll('.card')[0].length;
    var p1score = d3.select('.p1').selectAll('.card')[0].length;

    this.counts[0].push(p0score);
    this.counts[1].push(p1score);

    this.vizualize([p0score,p1score]);

    if (p0score == 0 || p1score == 0){
      d3.select('#shuffle').attr('disabled','true');
      d3.select('#deal').attr('disabled','true');
      d3.select('#play').attr('disabled','true');
      d3.select('#reset').attr('disabled',null);
      d3.select('#auto').attr('disabled','true');
    }
  },
  vizualize:function(data){
    var line = this.components.singleLine;
    var lineGen = this.components.singleGen;
    line.transition().duration(300).attr('d',function(){
      return lineGen([26,data[0],26]);
    });
    var scores = this.components.scores.data(data);
    scores.text(function(d){return d});
    this.components.playCount.text(this.plays);
  },
  burn:function(plays){
    var burnCounts = this.getBurnCounts();
    var burnPile = this.components.burnPile;
    this.components.stackG.each(function(d,i){
      var dump = d3.select(this).selectAll('.card').filter(function(e,j){return j<burnCounts[i]});
      dump.each(function(f,k){
        d3.select(this).transition().delay(500).attr('class','card burn');
        var that = d3.select(this).remove();
        burnPile.append(function(){
          return that.node();
        })
      })
    })
    this.components.inPlay.selectAll('.card')
      .each(function(d,i){
        d3.select(this).transition().delay(1000).attr('class','card burn');
        var that = d3.select(this).remove();
        burnPile.append(function(){
          return that.node();
        });
      });
  },
  getBurnCounts:function(){
    var burns = [];
    this.components.stackG.each(function(d,i){
      var len = d3.select(this).selectAll('.card')[0].length;
      var burn = (len>3)?3:len - 1;
      burns.push(burn);
    })
    return burns;
  },
  giveWinner:function(winner){
    var winnings = this.components.inPlay.selectAll('.card')
      .transition().delay(1000)
      .attr('class','card').attr('stack',winner);
    winnings.each(function(d,i){
      var that = d3.select(this).remove();
      d3.select('.p'+winner).append(function(){
        return that.node();
      })
    })
  },
  giveWinnerBurn:function(winner){
    this.components.burnPile.selectAll('.card').each(function(d,i){
      d3.select(this).transition().delay(500).attr('class','card').attr('stack',winner)
      var that = d3.select(this).remove();
      d3.select('.p'+winner).append(function(){
        return that.node();
      });
    });
  },
  resetDeck:function(){
    var deck = this.components.deck;
    this.components.svg.selectAll('.card')
      .each(function(d,i){
      var that = d3.select(this).remove();
      deck.append(function(){
        return that.node();
      })
    })
    .transition().delay(300).attr('class','card').attr('stack',null);
    this.plays = 0;
    this.vizualize([26,26]);
    this.counts = [[],[]];
    clearInterval(this.interval);
  },
  autoComplete:function(){
    var p0score = d3.select('.p0').selectAll('.card')[0].length;
    var playsFxn = this.getPlays;
    var playHandFxn = this.playHand;
    var interval = this.interval
    var self = this;
    this.interval = setInterval(function(){
      var plays = self.getPlays();
      self.playHand(plays);
      p0score = d3.select('.p0').selectAll('.card')[0].length;
      if (p0score == 0 || p0score == 52){
        clearInterval(self.interval);
      }
    },50);
  },
  buttonHookup:function(){
    d3.select('#shuffle').on('click',function(){
      war.shuffle();
    });
    d3.select('#deal').on('click', function(){
      d3.select('#shuffle').attr('disabled','true');
      d3.select(this).attr('disabled','true');
      d3.select('#play').attr('disabled',null);
      d3.select('#reset').attr('disabled',null);
      d3.select('#auto').attr('disabled',null);
      war.dealDeck(2);
    });
    d3.select('#play').on('click', function(){
      var plays = war.getPlays();
      war.playHand(plays);
    });
    d3.select('#reset').on('click',function(){
      d3.select('#shuffle').attr('disabled',null);
      d3.select('#deal').attr('disabled',null);
      d3.select('#play').attr('disabled','true');
      d3.select(this).attr('disabled','true');
      d3.select('#auto').attr('disabled','true');
      war.resetDeck();
    });
    d3.select('#auto').on('click',function(){
      d3.select('#play').attr('disabled','true');
      d3.select(this).attr('disabled','true');
      war.autoComplete();
    })
  },
  gameInit:function(){
    this.buildComponents();
    this.buildCards();
    this.buttonHookup();
  }
}
war.gameInit();
