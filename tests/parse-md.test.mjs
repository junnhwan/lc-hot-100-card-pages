import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseHot100Markdown } from '../scripts/lib/parse-md.mjs';

describe('parseHot100Markdown', () => {
  it('parses category header and strips trailing number', () => {
    const md = `### 哈希 3

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

\`\`\`Go
func twoSum(nums []int, target int) []int {
    return nil
}
\`\`\`
`;
    const { categories, problems } = parseHot100Markdown(md);
    assert.equal(categories[0].name, '哈希');
    assert.equal(categories[0].count, 1);
    assert.equal(categories[0].order, 0);
    assert.equal(problems[0].category, '哈希');
    assert.equal(problems[0].categoryOrder, 0);
  });

  it('parses problem link: id, title, slug, url', () => {
    const md = `### 哈希 3

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

\`\`\`Go
func twoSum(nums []int, target int) []int {
    return nil
}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems[0].id, '1');
    assert.equal(problems[0].title, '两数之和');
    assert.equal(problems[0].slug, 'two-sum');
    assert.equal(problems[0].url, 'https://leetcode.cn/problems/two-sum/');
  });

  it('captures Go fence as ready code', () => {
    const md = `### 哈希 3

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

\`\`\`Go
func twoSum(nums []int, target int) []int {
    return nil
}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems[0].status, 'ready');
    assert.match(problems[0].code, /func twoSum/);
  });

  it('marks empty code as stub', () => {
    const md = `### 子串

[76\\. 最小覆盖子串](https://leetcode.cn/problems/minimum-window-substring/)

\`\`\`Go

\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems[0].status, 'stub');
    assert.equal(problems[0].code, null);
  });

  it('marks title-only noise (no func) as stub', () => {
    const md = `### 子串

[76\\. 最小覆盖子串](https://leetcode.cn/problems/minimum-window-substring/)

\`\`\`Go
// 76. 最小覆盖子串
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems[0].status, 'stub');
    assert.equal(problems[0].code, null);
  });

  it('captures SQL-labeled fence with Go body', () => {
    const md = `### 双指针 4

[283\\. 移动零](https://leetcode.cn/problems/move-zeroes/)

\`\`\`SQL
func moveZeroes(nums []int)  {
    left := 0
}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems[0].status, 'ready');
    assert.match(problems[0].code, /func moveZeroes/);
  });

  it('parses hints and notes blockquotes between link and fence', () => {
    const md = `### 哈希 1

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

> **hints**
> - 用哈希表存已见
> - 边扫边查

> **notes**
> - 先查后写

\`\`\`Go
func twoSum(nums []int, target int) []int {
    return nil
}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.deepEqual(problems[0].hintsFromMd, ['用哈希表存已见', '边扫边查']);
    assert.deepEqual(problems[0].notesFromMd, ['先查后写']);
    assert.equal(problems[0].status, 'ready');
  });

  it('ignores ### template category', () => {
    const md = `### template

[999\\. 假题](https://leetcode.cn/problems/fake/)

\`\`\`Go
func fake() {}
\`\`\`

### 哈希 1

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

\`\`\`Go
func twoSum() {}
\`\`\`
`;
    const { categories, problems } = parseHot100Markdown(md);
    assert.equal(categories.length, 1);
    assert.equal(categories[0].name, '哈希');
    assert.equal(problems.length, 1);
    assert.equal(problems[0].id, '1');
  });

  it('categoryOrder follows first appearance order in MD', () => {
    const md = `### 哈希 1

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

\`\`\`Go
func twoSum() {}
\`\`\`

### 双指针 1

[283\\. 移动零](https://leetcode.cn/problems/move-zeroes/)

\`\`\`Go
func moveZeroes() {}
\`\`\`

### 滑动窗口 1

[3\\. 无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)

\`\`\`Go
func lengthOfLongestSubstring() {}
\`\`\`
`;
    const { categories, problems } = parseHot100Markdown(md);
    assert.deepEqual(
      categories.map((c) => c.name),
      ['哈希', '双指针', '滑动窗口'],
    );
    assert.deepEqual(
      categories.map((c) => c.order),
      [0, 1, 2],
    );
    assert.equal(problems[0].categoryOrder, 0);
    assert.equal(problems[1].categoryOrder, 1);
    assert.equal(problems[2].categoryOrder, 2);
  });

  it('scopes body until next problem; no fence → stub; does not steal next code', () => {
    const md = `### 回溯 8

[17\\. 电话号码的字母组合](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/)

[39\\. 组合总和](https://leetcode.cn/problems/combination-sum/)

\`\`\`Go
func combinationSum() {}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems.length, 2);
    assert.equal(problems[0].id, '17');
    assert.equal(problems[0].status, 'stub');
    assert.equal(problems[0].code, null);
    assert.equal(problems[1].id, '39');
    assert.equal(problems[1].status, 'ready');
    assert.match(problems[1].code, /combinationSum/);
  });

  it('ignores orphan fences in category prose', () => {
    const md = `### 二分查找 6

\`\`\`SQL
func lowerBound() {}
\`\`\`

[35\\. 搜索插入位置](https://leetcode.cn/problems/search-insert-position/)

\`\`\`Go
func searchInsert() {}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems.length, 1);
    assert.equal(problems[0].id, '35');
    assert.match(problems[0].code, /searchInsert/);
    assert.doesNotMatch(problems[0].code || '', /lowerBound/);
  });

  it('prefers last non-empty fence containing func when multiple fences', () => {
    const md = `### 数组

[34\\. 在排序数组中查找元素的第一个和最后一个位置](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/)

\`\`\`Go
// draft
func searchRangeDraft() {}
\`\`\`

\`\`\`Go
func searchRange(nums []int, target int) []int {
    return nil
}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems[0].status, 'ready');
    assert.match(problems[0].code, /func searchRange\(/);
    assert.doesNotMatch(problems[0].code, /searchRangeDraft/);
  });

  it('later duplicate id overwrites earlier', () => {
    const md = `### A 1

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

\`\`\`Go
func twoSumOld() {}
\`\`\`

### B 1

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

\`\`\`Go
func twoSumNew() {}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems.length, 1);
    assert.equal(problems[0].id, '1');
    assert.match(problems[0].code, /twoSumNew/);
    assert.equal(problems[0].category, 'B');
  });

  it('scopes body until next category header', () => {
    const md = `### 哈希 1

[1\\. 两数之和](https://leetcode.cn/problems/two-sum/)

### 双指针 1

[283\\. 移动零](https://leetcode.cn/problems/move-zeroes/)

\`\`\`Go
func moveZeroes() {}
\`\`\`
`;
    const { problems } = parseHot100Markdown(md);
    assert.equal(problems.length, 2);
    assert.equal(problems[0].id, '1');
    assert.equal(problems[0].status, 'stub');
    assert.equal(problems[0].code, null);
    assert.equal(problems[1].id, '283');
    assert.equal(problems[1].status, 'ready');
  });
});
