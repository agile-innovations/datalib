'use strict';

var assert = require('chai').assert;
var util = require('../src/util');
var stats = require('../src/stats');
var groupby = require('../src/aggregate/groupby');

describe('aggregate', function() {

  describe('groupby', function() {
    var table = [
      {a: 1, b: 1},
      {a: 2, b: 2},
      {a: 3, b: 2},
      {a: 3, b: 1}
    ];

    it('should accept string argument', function() {
      assert.equal(3, groupby('a').execute(table).length);
      assert.equal(2, groupby('b').execute(table).length);
    });

    it('should accept array argument', function() {
      assert.equal(3, groupby(['a']).execute(table).length);
      assert.equal(2, groupby(['b']).execute(table).length);
      assert.equal(4, groupby(['a','b']).execute(table).length);
      assert.equal(4, groupby(['b','a']).execute(table).length);
    });

    it('should accept accessor arguments', function() {
      var a = util.accessor('a');
      var b = util.accessor('b');
      assert.equal(3, groupby(a).execute(table).length);
      assert.equal(2, groupby(b).execute(table).length);
      assert.equal(4, groupby([a,b]).execute(table).length);
      assert.equal(4, groupby([b,a]).execute(table).length);
    });

    it('should accept object arguments', function() {
      var a = {name:'a', get:util.accessor('a')};
      var b = {name:'a', get:util.accessor('b')};
      assert.equal(3, groupby(a).execute(table).length);
      assert.equal(2, groupby(b).execute(table).length);
      assert.equal(4, groupby([a,b]).execute(table).length);
      assert.equal(4, groupby([b,a]).execute(table).length);
    });

    it('should accept varargs', function() {
      assert.equal(4, groupby('a', 'b').execute(table).length);
      assert.equal(4, groupby('b', 'a').execute(table).length);
    });

    it('should collect values by default', function() {
      var g = groupby('b').execute(table);
      assert.deepEqual([table[0], table[3]], g[0].values);
      assert.deepEqual([table[1], table[2]], g[1].values);
    });

    it('should handle null, undefined and NaN values', function() {
      var data = [{a:null}, {a:undefined}, {a:NaN}, {a:NaN}, {a:1}];
      assert.equal(4, groupby('a').execute(data).length);
    });
  });
  
  describe('summarize', function() {
    var values = [1, 2, 3, null, 4, 5, 6, undefined, NaN, 7, 8, 9];
    var table = values.map(function(x) { return {a:x}; });

    function run(obj) {
      return groupby().summarize(obj).execute(table)[0];
    }

    it('should accept object arguments', function() {
      var sum = run({'a':'sum'}).sum_a;
      var mean = run({'a':'mean'}).mean_a;
      var both = run({'a':['sum','mean']});
      assert.equal(sum, both.sum_a);
      assert.equal(mean, both.mean_a);
    });

    it('should accept array arguments', function() {
      var sum  = run([{name:'a', ops:['sum']}]).sum_a;
      var mean = run([{name:'a', ops:['mean']}]).mean_a;
      var both = run([{name:'a', ops:['sum','mean']}]);
      assert.equal(sum, both.sum_a);
      assert.equal(mean, both.mean_a);
    });

    it('should support output renaming', function() {
      var sum1 = run([{name:'a', ops:['sum']}]).sum_a;
      var sum2 = run([{name:'a', ops:['sum'], as:['hello']}]).hello;
      assert.equal(sum1, sum2);
    });

    it('should support getter argument', function() {
      var sum1 = run([{name:'a', ops:['sum']}]).sum_a;
      var sum2 = run([{name:'f', get:util.accessor('a'), ops:['sum']}]).sum_f;
      var sum3 = run([{name:'f', get:'a', ops:['sum']}]).sum_f;
      assert.equal(sum1, sum2);
      assert.equal(sum1, sum3);
    });

    it('should handle null arguments', function() {
      var none = groupby().summarize().execute(table)[0];
      var nulls = run(null);
      var undef = run(undefined);
      var array = run([]);
      assert.deepEqual(none,  nulls);
      assert.deepEqual(nulls, undef);
      assert.deepEqual(undef, array);
    });

    it('should collect values', function() {
      assert.deepEqual(table, run({'*':'values'}).values);
    });

    it('should count all values', function() {
      assert.equal(stats.count(values), run({'*':'count'}).count);
    });

    it('should count missing values', function() {
      assert.equal(stats.count.missing(values), run({'a':'missing'}).missing_a);
    });

    it('should count valid values', function() {
      assert.equal(stats.count.valid(values), run({'a':'valid'}).valid_a);
    });

    it('should count distinct values', function() {
      assert.equal(stats.count.distinct(values), run({'a':'distinct'}).distinct_a);
    });

    it('should compute sum', function() {
      assert.equal(stats.sum(values), run({'a':'sum'}).sum_a);
    });

    it('should compute median', function() {
      assert.equal(stats.median(values), run({'a':'median'}).median_a);
    });

    it('should compute q1', function() {
      assert.equal(stats.quartile(values)[0], run({'a':'q1'}).q1_a);
    });

    it('should compute q3', function() {
      assert.equal(stats.quartile(values)[2], run({'a':'q3'}).q3_a);
    });

    it('should compute mean', function() {
      assert.equal(stats.mean(values), run({'a':'mean'}).mean_a);
    });

    it('should compute average', function() {
      assert.equal(stats.mean(values), run({'a':'average'}).average_a);
    });

    it('should compute variance', function() {
      assert.equal(stats.variance(values), run({'a':'variance'}).variance_a);
    });

    it('should compute stdev', function() {
      assert.equal(stats.stdev(values), run({'a':'stdev'}).stdev_a);
    });

    it('should compute variancep', function() {
      var N = stats.count.valid(values);
      var v = stats.variance(values);
      assert.equal((N-1)*v/N, run({'a':'variancep'}).variancep_a);
    });

    it('should compute stdevp', function() {
      var N = stats.count.valid(values);
      var v = stats.variance(values);
      assert.equal(Math.sqrt((N-1)*v/N), run({'a':'stdevp'}).stdevp_a);
    });

    it('should compute modeskew', function() {
      assert.equal(stats.modeskew(values), run({'a':'modeskew'}).modeskew_a);
    });

    it('should compute min', function() {
      assert.equal(stats.extent(values)[0], run({'a':'min'}).min_a);
    });

    it('should compute max', function() {
      assert.equal(stats.extent(values)[1], run({'a':'max'}).max_a);
    });

    it('should compute argmin', function() {
      assert.strictEqual(table[0], run({'a':'argmin'}).argmin_a);
    });

    it('should compute argmax', function() {
      assert.strictEqual(table[table.length-1], run({'a':'argmax'}).argmax_a);
    });

    it('should support multiple measure fields', function() {
      var data = [
        {a: 1, b: 5},
        {a: 2, b: 6},
        {a: 3, b: 7}
      ];
      var m = groupby().summarize({a:'median', b:'median'}).execute(data);
      assert.equal(2, m[0].median_a);
      assert.equal(6, m[0].median_b);
    });
  });

  describe('aggregator', function() {
    var table = [
      {a:1, b:1},
      {a:2, b:1},
      {a:3, b:2},
      {a:4, b:2}
    ];

    it('should accept streaming inserts', function() {
      var sum = groupby().summarize({'a': ['sum', 'max']})
        .insert([table[0], table[1]])
        .insert([table[2], table[3]])
        .result();
      assert.equal(10, sum[0].sum_a);
      assert.equal(4, sum[0].max_a);
    });

    it('should reject streaming removes if unrequested', function() {
      assert.throws(function() {
        var sum = groupby().summarize({'a': ['sum', 'max']})
          .insert(table)
          .remove([table[2], table[3]])
          .result();
      });
    });

    it('should accept streaming removes if requested', function() {
      var sum = groupby()
        .stream(true)
        .summarize({'a': ['sum', 'max']})
        .insert(table)
        .remove([table[2], table[3]])
        .result();
      assert.equal(3, sum[0].sum_a);
      assert.equal(2, sum[0].max_a);
    });

    it('should support streaming removes by key', function() {
      var sum = groupby().key('a')
        .stream(true)
        .summarize({'a': ['sum', 'max']})
        .insert(table)
        .remove([{a:3, b:2}, {a:4, b:2}])
        .result();
      assert.equal(3, sum[0].sum_a);
      assert.equal(2, sum[0].max_a);
    });

    it('should support streaming modifications by key', function() {
      var add = [
         {"x":1,"y":28,"_id":1},
         {"x":2,"y":55,"_id":2},
         {"x":3,"y":43,"_id":3},
         {"x":4,"y":91,"_id":4},
         {"x":5,"y":81,"_id":5},
         {"x":6,"y":53,"_id":6},
         {"x":7,"y":19,"_id":7},
         {"x":8,"y":87,"_id":8},
         {"x":9,"y":52,"_id":9},
         {"x":10,"y":48,"_id":10},
         {"x":11,"y":24,"_id":11},
         {"x":12,"y":49,"_id":12},
         {"x":13,"y":87,"_id":13},
         {"x":14,"y":66,"_id":14},
         {"x":15,"y":17,"_id":15},
         {"x":16,"y":27,"_id":16},
         {"x":17,"y":68,"_id":17},
         {"x":18,"y":16,"_id":18},
         {"x":19,"y":49,"_id":19},
         {"x":20,"y":15,"_id":20}
      ];
      var rem = [
         {"x":1,"y":28,"_id":1},
         {"x":3,"y":43,"_id":3},
         {"x":5,"y":81,"_id":5},
         {"x":7,"y":19,"_id":7},
         {"x":9,"y":52,"_id":9},
         {"x":11,"y":24,"_id":11},
         {"x":13,"y":87,"_id":13},
         {"x":15,"y":17,"_id":15},
         {"x":17,"y":68,"_id":17},
         {"x":19,"y":49,"_id":19},
         {"x":2,"y":55,"_id":2},
         {"x":4,"y":91,"_id":4},
         {"x":6,"y":53,"_id":6},
         {"x":8,"y":87,"_id":8},
         {"x":10,"y":48,"_id":10},
         {"x":12,"y":49,"_id":12},
         {"x":14,"y":66,"_id":14},
         {"x":16,"y":27,"_id":16},
         {"x":18,"y":16,"_id":18},
         {"x":20,"y":15,"_id":20}
      ];
      var mod = [
         {"x":2,"y":56,"_id":1},
         {"x":6,"y":86,"_id":3},
         {"x":10,"y":162,"_id":5},
         {"x":14,"y":38,"_id":7},
         {"x":18,"y":104,"_id":9},
         {"x":22,"y":48,"_id":11},
         {"x":26,"y":174,"_id":13},
         {"x":30,"y":34,"_id":15},
         {"x":34,"y":136,"_id":17},
         {"x":38,"y":98,"_id":19},
         {"x":2,"y":110,"_id":2},
         {"x":4,"y":182,"_id":4},
         {"x":6,"y":106,"_id":6},
         {"x":8,"y":174,"_id":8},
         {"x":10,"y":96,"_id":10},
         {"x":12,"y":98,"_id":12},
         {"x":14,"y":132,"_id":14},
         {"x":16,"y":54,"_id":16},
         {"x":18,"y":32,"_id":18},
         {"x":20,"y":30,"_id":20}
      ];

      var agg = groupby()
        .stream(true).key('_id')
        .summarize({'y': ['min', 'max']});
      agg.insert(add).changes();
      var r = agg.remove(rem).insert(mod).result();
      assert.equal( 30, r[0].min_y);
      assert.equal(182, r[0].max_y);
    });

    it('should support summary modification by key', function() {
      var add = [
         {"x":1,"y":28,"_id":1},
         {"x":2,"y":55,"_id":2},
         {"x":3,"y":13,"_id":3},
         {"x":4,"y":91,"_id":4}
      ];
      var mod = [
         {"x":2,"y":56,"_id":1},
         {"x":6,"y":86,"_id":3},
         {"x":2,"y":110,"_id":2},
         {"x":4,"y":182,"_id":4}
      ];

      var agg = groupby()
        .stream(true).key('_id')
        .summarize({'y': ['min', 'max']});
      agg.insert(add).changes();
      for (var i=0; i<mod.length; ++i) {
        var t = mod[i],
            a = add[t._id-1],
            p = {x: a.x, y: a.y, _id: a.id};
        a.x = t.x; a.y = t.y;
        agg._mod(a, p);
      }
      var r = agg.result();
      assert.equal( 56, r[0].min_y);
      assert.equal(182, r[0].max_y);
    });

    it('should support groupby modification by key', function() {
      var table = [
        {country: 'US', type: 'gold', count: 100, _id: 0},
        {country: 'US', type: 'silver', count: 13, _id: 1},
        {country: 'US', type: 'bronze', count: 15, _id: 2},
        {country: 'Canada', type: 'gold', count: 5, _id: 3},
        {country: 'Canada', type: 'silver', count: 4, _id: 4},
        {country: 'Canada', type: 'bronze', count: 3, _id: 5}
      ];
      var agg = groupby('country')
        .stream(true).key('_id')
        .summarize({count: ['min', 'max']});

      agg.execute(table);
      var old = util.duplicate(table[0]);
      table[0].country = "India";
      agg._mod(table[0], old);
      var r = agg.result().sort(util.comparator("+country"));

      assert.equal(  3, r[0].min_count); // Canada
      assert.equal(  5, r[0].max_count);
      assert.equal(100, r[1].min_count); // India
      assert.equal(100, r[1].max_count);
      assert.equal( 13, r[2].min_count); // U.S.
      assert.equal( 15, r[2].max_count);
    });

    it('should return streaming change sets', function() {
      var set = groupby()
        .stream(true)
        .summarize({'a': ['sum', 'max']})
        .insert(table)
        .remove([table[2], table[3]])
        .changes();
      assert.equal(1, set.add.length);
      assert.equal(0, set.rem.length);
      assert.equal(0, set.mod.length);

      var gb = groupby()
        .stream(true)
        .summarize({'a': ['sum', 'max']})
        .insert(table);
      var set1 = gb.changes();
      assert.equal(1, set1.add.length);
      assert.equal(0, set1.rem.length);
      assert.equal(0, set1.mod.length);

      var set2 = gb.remove([table[2], table[3]]).changes();
      assert.equal(0, set2.add.length);
      assert.equal(0, set2.rem.length);
      assert.equal(1, set2.mod.length);

      var set3 = gb.remove([table[0], table[1]]).changes();
      assert.equal(0, set3.add.length);
      assert.equal(1, set3.rem.length);
      assert.equal(0, set3.mod.length);
      
      assert.strictEqual(set1.add[0], set2.mod[0]);
      assert.strictEqual(set1.add[0], set3.rem[0]);
    });

    it('should support streaming of raw values', function() {
      var agg = groupby().stream(true).summarize([{
        name: 'value',
        get:  util.identity,
        ops:  ['min', 'max'],
        as:   ['min', 'max']
      }]);

      var domain1 = [{a:1}, {a:3}, {a:6}];
      var domain2 = [{b:9}, {b:2}];
      var f1 = util.$('a');
      var f2 = util.$('b');

      var r = agg
        .insert(domain1.map(f1)) // or, looping calls to _add
        .insert(domain2.map(f2)) // to avoid array creation
        .result()[0];
      assert.equal(1, r.min);
      assert.equal(9, r.max);

      r = agg
        .remove([f1(domain1[0])])
        .remove([f2(domain2[0])])
        .result()[0];
      assert.equal(2, r.min);
      assert.equal(6, r.max);
    });

  });
});