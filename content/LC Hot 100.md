# LC Hot 100

### 哈希 3

[1\. 两数之和](https://leetcode.cn/problems/two-sum/)

```Go
func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, num := range nums {
        if j,ok := m[target-num]; ok {
            return []int{i, j}
        }
        m[num] = i
    }
    return nil
}
```

[49\. 字母异位词分组](https://leetcode.cn/problems/group-anagrams/)

```Go
func groupAnagrams(strs []string) [][]string {
    m := make(map[string][]string)
    for _,s := range strs {
        b := []byte(s) // 转成字节切片,后面排序
        sort.Slice(b, func(i, j int) bool {
            return b[i] < b[j]
        })
        key := string(b)
        m[key] = append(m[key], s)
    }
    res := make([][]string, 0, len(m))
    for _,v := range m {
        res = append(res, v)
    }
    return res
}
```

[128\. 最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/)

```Go
func longestConsecutive(nums []int) int {
    if len(nums) == 0 {
        return 0
    }
    set := make(map[int]bool)
    for _, x := range nums {
        set[x] = true
    }
    maxLen := 1
    for x := range set {
        if !set[x-1] { // 这里注意是 x-1, 减1是因为如果减1不在当前数才是起点
            length := 1
            for set[x+length] {
                length++
            }
            if length > maxLen {
                maxLen = length
            }
        }
    }
    return maxLen
}
```



### 双指针 4

[283\. 移动零](https://leetcode.cn/problems/move-zeroes/)

```SQL
func moveZeroes(nums []int)  {
    left := 0
    for right := 0;right < len(nums);right++ {
        if nums[right] != 0 {
            nums[left], nums[right] = nums[right], nums[left]
            left++
        }
    }
}
```

[11\. 盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/)

```SQL
func maxArea(height []int) int {
    left, right := 0, len(height)-1
    maxA := 0
    for left < right {
        h := height[left]
        if height[right] < h {
            h = height[right]
        }
        w := right-left
        if h*w > maxA {
            maxA = h*w
        }
        if height[left] < height[right] {
            left++
        } else {
            right--
        }
    }
    return maxA
}
```

[15\. 三数之和](https://leetcode.cn/problems/3sum/)

```SQL
func threeSum(nums []int) [][]int {
    sort.Ints(nums)
    n := len(nums)
    res := [][]int{}
    for i := 0;i < n-2;i++ {
        if i > 0 && nums[i] == nums[i-1] {
            continue
        }
        left, right := i+1, n-1
        for left < right {
            sum := nums[left] + nums[i] + nums[right]
            if sum == 0 {
                res = append(res, []int{nums[left], nums[i], nums[right]})
                for left < right && nums[left] == nums[left+1] {
                    left++
                }
                for left < right && nums[right] == nums[right-1] {
                    right--
                }
                left++
                right--
            } else if sum < 0 {
                left++
            } else {
                right--
            }
        }
    }
    return res
}
```

[42\. 接雨水](https://leetcode.cn/problems/trapping-rain-water/)

```SQL
func trap(height []int) int {
    left, right := 0, len(height)-1
    ans := 0
    leftMax, rightMax := 0, 0
    for left < right {
        if height[left] < height[right] {
            if height[left] < leftMax {
                ans += leftMax - height[left]
            } else {
                leftMax = height[left]
            }
            left++
        } else {
            if height[right] < rightMax {
                ans += rightMax - height[right]
            } else {
                rightMax = height[right]
            }
            right--
        }
    }
    return ans
}
```



### 滑动窗口 2

[3\. 无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)

```SQL
func lengthOfLongestSubstring(s string) int {
    m := make(map[byte]int)
    ans := 0
    left := 0
    for right := 0;right < len(s);right++ {
        if idx, ok := m[s[right]];ok && idx >= left {
            left = idx + 1
        }
        m[s[right]] = right
        if right - left + 1 > ans {
            ans = right - left + 1
        }
    }
    return ans
}
```

[438\. 找到字符串中所有字母异位词](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)

```Go
func findAnagrams(s string, p string) []int {
    if len(s) < len(p) {
        return nil
    }
    need := [26]int{}
    for i := range p {
        need[p[i]-'a']++
    }
    window := [26]int{}
    left := 0
    res := []int{}
    for right := 0; right < len(s);right++ {
        window[s[right]-'a']++
        if right-left+1 == len(p) {
            if window == need {
                res = append(res, left)
            }
            window[s[left]-'a']--
            left++
        }
    }
    return res
}
```



### 子串 3

[560\. 和为 K 的子数组](https://leetcode.cn/problems/subarray-sum-equals-k/)

```Go
func subarraySum(nums []int, k int) int {
    m := make(map[int]int)
    prefix := 0
    ans := 0
    m[0] = 1
    for _, num := range nums {
        prefix += num
        if v, ok := m[prefix-k]; ok {
            ans += v
        }
        m[prefix]++
    }
    return ans
}
```

[239\. 滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/)

```Go
func maxSlidingWindow(nums []int, k int) []int {
    deque := []int{}
    res := []int{}
    for i := range nums {
        // 1. 清理队尾
        for len(deque) > 0 && nums[deque[len(deque)-1]] < nums[i] {
            deque = deque[:len(deque)-1]
        }
        // 2. 加入当前索引
        deque = append(deque, i)
        // 3. 清理队首
        if deque[0] == i-k {
            deque = deque[1:]
        }
        if i >= k-1 {
            res = append(res, nums[deque[0]])
        }
    }
    return res
}
```

[76\. 最小覆盖子串](https://leetcode.cn/problems/minimum-window-substring/)

```Go

```



### 普通数组 5

[53\. 最大子数组和](https://leetcode.cn/problems/maximum-subarray/)

```Go
func maxSubArray(nums []int) int {
    maxSum := nums[0]
    curSum := nums[0]
    for i := 1;i < len(nums);i++ {  // 注意是从第二个元素开始因为第一个已经在上面打底赋值了
        if curSum + nums[i] < nums[i] {
            curSum = nums[i]
        } else {
            curSum += nums[i]
        }
        if curSum > maxSum {
            maxSum = curSum
        }
    }
    return maxSum
}
```

[56\. 合并区间](https://leetcode.cn/problems/merge-intervals/)

```Go
56. 合并区间
```

[189\. 轮转数组](https://leetcode.cn/problems/rotate-array/)

```Go
func rotate(nums []int, k int)  {
    n := len(nums)
    if k % n == 0 {
        return
    }
    k = k % n
    reverse := func(l, r int) {
        for l < r {
            nums[l], nums[r] = nums[r], nums[l]
            l++
            r--
        }
    }
    reverse(0, n-1)
    reverse(0, k-1)
    reverse(k, n-1)
}
```

[238\. 除了自身以外数组的乘积](https://leetcode.cn/problems/product-of-array-except-self/)

```Go
func productExceptSelf(nums []int) []int {
    n := len(nums)
    res := make([]int, n)
    res[0] = 1
    for i := 1;i < n;i++ {
        res[i] = res[i-1]*nums[i-1]
    }
    rightProduct := 1
    for i := n-1;i >= 0;i-- {
        res[i] *= rightProduct
        rightProduct *= nums[i]
    }
    return res
}
```

[41\. 缺失的第一个正数](https://leetcode.cn/problems/first-missing-positive/)

```Go
func firstMissingPositive(nums []int) int {
    n := len(nums)
    for i := 0;i < n;i++ {
        // 注意这里是用for 循环，不是if判断一次，是要until
        for nums[i] > 0 && nums[i] <= n && nums[nums[i]-1] != nums[i] {
            correctIdx := nums[i] -1
            nums[i], nums[correctIdx] = nums[correctIdx], nums[i]
        }
    }
    for i := 0;i < n;i++ {
        if nums[i] != i + 1 {
            return i + 1
        }
    }
    return n + 1
}
```



### 矩阵 4

[73\. 矩阵置零](https://leetcode.cn/problems/set-matrix-zeroes/)

```Go
func setZeroes(matrix [][]int)  {
    // 1. 先处理第一行和第一列的问题，因为这两者本身要作为标记
    m, n := len(matrix), len(matrix[0])
    row0, col0 := false, false
    for j := 0;j < n;j++ {
        if matrix[0][j] == 0 {
            row0 = true
            break
        }
    }
    for i := 0;i < m;i++ {
        if matrix[i][0] == 0 {
            col0 = true
            break
        }
    }
    for i := 1;i < m;i++ {
        for j := 1;j < n;j++ {
            if matrix[i][j] == 0 {
                matrix[0][j] = 0
                matrix[i][0] = 0
            }
        }
    }
    for i := 1;i < m;i++ {
        for j := 1;j < n;j++ {
            if matrix[i][0] == 0 || matrix[0][j] == 0 {
                matrix[i][j] = 0
            }
        }
    }
    if row0 {
        for i := 0;i < n;i++ {
            matrix[0][i] = 0
        }
    }
    if col0 {
        for i := 0;i < m;i++ {
            matrix[i][0] = 0
        }
    }
}
```

[54\. 螺旋矩阵](https://leetcode.cn/problems/spiral-matrix/)

```SQL
func spiralOrder(matrix [][]int) []int {
    m,n := len(matrix), len(matrix[0])
    ans := make([]int, 0, m*n)
    top, bottom, left, right := 0, m-1, 0, n-1
    for top <= bottom && left <= right {
        for i := left;i <= right;i++ {
            ans = append(ans, matrix[top][i])
        }
        top++
        for i := top;i <= bottom;i++ {
            ans = append(ans, matrix[i][right])
        }
        right--
        if top <= bottom {
            for i := right;i >= left;i-- {
                ans = append(ans, matrix[bottom][i])
            }
            bottom--
        }
        if left <= right {
            for i := bottom;i >= top;i-- {
                ans = append(ans, matrix[i][left])
            }
            left++
        }
    }
    return ans
}
```

[48\. 旋转图像](https://leetcode.cn/problems/rotate-image/)

```Go
func rotate(matrix [][]int)  {
    n := len(matrix)
    for i := 0;i < n;i++ {
        for j := i + 1;j < n;j++ {
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        }
    }
    for i := 0;i < n;i++ {
        for j := 0;j < n/2;j++ {
            matrix[i][n-1-j], matrix[i][j] = matrix[i][j], matrix[i][n-1-j]
        }
    }
}
```

[240\. 搜索二维矩阵 II](https://leetcode.cn/problems/search-a-2d-matrix-ii/)

```Go
func searchMatrix(matrix [][]int, target int) bool {
    m, n := len(matrix), len(matrix[0])
    
    row, col := 0, n-1
    
    for row < m && col >= 0 {
        cur := matrix[row][col]
        if cur == target {
            return true
        } else if cur < target {
            row++
        } else {
            col--
        }
    }
    return false
}
```



### 链表 14

[160\. 相交链表](https://leetcode.cn/problems/intersection-of-two-linked-lists/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func getIntersectionNode(headA, headB *ListNode) *ListNode {
    if headA == nil || headB == nil {
        return nil
    }
    a, b := headA, headB
    for a != b {
        // 注意这里两个if判断不是.Next是否为nil，是当前节点是否为nil，否则二者的总路程会不一样
        if a != nil {
            a = a.Next
        } else {
            a = headB
        }
        if b != nil {
            b = b.Next
        } else {
            b = headA
        }
    }
    return a
}
```

[206\. 反转链表](https://leetcode.cn/problems/reverse-linked-list/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func reverseList(head *ListNode) *ListNode {
    var pre *ListNode
    cur := head
    for cur != nil {
        next := cur.Next
        cur.Next = pre
        pre = cur
        cur = next
    }
    return pre
}
```

[234\. 回文链表](https://leetcode.cn/problems/palindrome-linked-list/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func isPalindrome(head *ListNode) bool {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    var p *ListNode
    cur := slow
    for cur != nil {
        next := cur.Next
        cur.Next = p
        p = cur
        cur = next
    }
    second := p
    ahead := head
    for second != nil {
        if ahead.Val != second.Val {
            return false
        }
        ahead = ahead.Next
        second = second.Next
    }
    return true
}
```

[141\. 环形链表](https://leetcode.cn/problems/linked-list-cycle/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func hasCycle(head *ListNode) bool {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        if slow == fast {
            return true
        }
    }
    return false
}
```

[142\. 环形链表 II](https://leetcode.cn/problems/linked-list-cycle-ii/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func detectCycle(head *ListNode) *ListNode {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        if slow == fast {
            p1, p2 := head, slow
            for p1 != p2 {
                p1 = p1.Next
                p2 = p2.Next
            }
            return p1
        }
    }
    return nil
}
```

[21\. 合并两个有序链表](https://leetcode.cn/problems/merge-two-sorted-lists/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for list1 != nil && list2 != nil {
        if list1.Val < list2.Val {
            cur.Next = list1
            list1 = list1.Next
        } else {
            cur.Next = list2
            list2 = list2.Next
        }
        cur = cur.Next
    }
    if list1 != nil {
        cur.Next = list1
    } else {
        cur.Next = list2
    }
    return dummy.Next
}
```

[2\. 两数相加](https://leetcode.cn/problems/add-two-numbers/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    carry := 0
    for l1 != nil || l2 != nil || carry != 0 {
        var v1, v2 int
        if l1 != nil {
            v1 = l1.Val
            l1 = l1.Next
        }
        if l2 != nil {
            v2 = l2.Val
            l2 = l2.Next
        }
        sum := v1 + v2 + carry
        carry = sum / 10
        cur.Next = &ListNode{Val: sum % 10}
        cur = cur.Next
    }
    return dummy.Next
}
```

[19\. 删除链表的倒数第 N 个结点](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func removeNthFromEnd(head *ListNode, n int) *ListNode {
    dummy := &ListNode{Next: head}
    slow, fast := dummy, dummy
    for i := 0;i <= n;i++ {
        fast = fast.Next
    }
    for fast != nil {
        slow = slow.Next
        fast = fast.Next
    }
    slow.Next = slow.Next.Next
    return dummy.Next
}
```

[24\. 两两交换链表中的节点](https://leetcode.cn/problems/swap-nodes-in-pairs/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func swapPairs(head *ListNode) *ListNode {
    dummy := &ListNode{Next: head}
    cur := dummy
    for cur.Next != nil && cur.Next.Next != nil {
        node1 := cur.Next
        node2 := cur.Next.Next
        cur.Next = node2
        node1.Next = node2.Next
        node2.Next = node1

        cur = node1
    }
    return dummy.Next
}
```

[25\. K 个一组翻转链表](https://leetcode.cn/problems/reverse-nodes-in-k-group/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func reverseKGroup(head *ListNode, k int) *ListNode {
    dummy := &ListNode{Next: head}
    prevGroupTail := dummy
    for {
        // 1. 检查是否有k个，没有的话可以直接return
        tail := prevGroupTail
        for i := 0;i < k;i++ {
            tail = tail.Next
            if tail == nil {
                return dummy.Next
            }
        }
        // 2. 记录好当前组和下一组的头节点
        groupHead := prevGroupTail.Next
        nextGroupHead := tail.Next
        // 3. 开始翻转k个节点
        prev, cur := nextGroupHead, groupHead
        for cur != nextGroupHead {
            next := cur.Next
            cur.Next = prev
            prev = cur
            cur = next
        }
        // 连接前后两组并更新为下一组做好准备
        prevGroupTail.Next = prev
        prevGroupTail = groupHead
    }
}
```

[138\. 随机链表的复制](https://leetcode.cn/problems/copy-list-with-random-pointer/)

```Go
/**
 * Definition for a Node.
 * type Node struct {
 *     Val int
 *     Next *Node
 *     Random *Node
 * }
 */

func copyRandomList(head *Node) *Node {
    if head == nil {
        return nil
    }
    cur := head
    for cur != nil {
        newNode := &Node{Val: cur.Val, Next: cur.Next}
        cur.Next = newNode
        cur = newNode.Next
    }
    cur = head
    for cur != nil {
        if cur.Random != nil {
            cur.Next.Random = cur.Random.Next
        }
        cur = cur.Next.Next
    }
    dummy := &Node{}
    cloneCur := dummy
    cur = head
    for cur != nil {
        cloneCur.Next = cur.Next
        cloneCur = cloneCur.Next
        cur.Next = cloneCur.Next
        cur = cur.Next
    }
    return dummy.Next
}
```

[148\. 排序链表](https://leetcode.cn/problems/sort-list/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func sortList(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return head
    }
    slow, fast := head, head
    var prev *ListNode
    for fast != nil && fast.Next != nil {
        prev = slow
        slow = slow.Next
        fast = fast.Next.Next
    }
    prev.Next = nil
    left := sortList(head)
    right := sortList(slow)
    return mergeTwoLists(left, right)
}
func mergeTwoLists(l1, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    cur := dummy
    for l1 != nil && l2 != nil {
        if l1.Val < l2.Val {
            cur.Next = l1
            l1 = l1.Next
        } else {
            cur.Next = l2
            l2 = l2.Next
        }
        cur = cur.Next
    }
    if l1 != nil {
        cur.Next = l1
    } else {
        cur.Next = l2
    }
    return dummy.Next
}
```

[23\. 合并 K 个升序链表](https://leetcode.cn/problems/merge-k-sorted-lists/)

```Go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
type MinHeap []*ListNode
func (h MinHeap) Len() int {return len(h)}
func (h MinHeap) Less(i, j int) bool {
    return h[i].Val < h[j].Val
}
func (h MinHeap) Swap(i, j int) {
    h[i], h[j] = h[j], h[i]
}
func (h *MinHeap) Push(x interface{}) {
    *h = append(*h, x.(*ListNode))
}
func (h * MinHeap) Pop() interface{} {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func mergeKLists(lists []*ListNode) *ListNode {
    h := &MinHeap{}
    heap.Init(h)
    for _, node := range lists {
        if node != nil {
            heap.Push(h, node)
        }
    }
    dummy := &ListNode{}
    cur := dummy
    for h.Len() > 0 {
        node := heap.Pop(h).(*ListNode)
        cur.Next = node
        cur = cur.Next
        if node.Next != nil {
            heap.Push(h, node.Next)
        }
    }
    return dummy.Next
}
```

[146\. LRU 缓存](https://leetcode.cn/problems/lru-cache/)

```Go
type Node struct {
    key, val int
    prev, next *Node
}

type LRUCache struct {
    capacity int
    cache map[int]*Node
    head, tail *Node
}

func Constructor(capacity int) LRUCache {
    head, tail := &Node{}, &Node{}
    head.next = tail
    tail.prev = head
    return LRUCache {
        capacity: capacity,
        cache: make(map[int]*Node),
        head: head,
        tail: tail,
    }
}

func (this *LRUCache) removeNode(node *Node) {
    node.prev.next = node.next
    node.next.prev = node.prev
}

func (this *LRUCache) addToHead(node *Node) {
    node.next = this.head.next
    node.prev = this.head
    this.head.next.prev = node
    this.head.next = node
}

func (this *LRUCache) moveToHead(node *Node) {
    this.removeNode(node)
    this.addToHead(node)
}

func (this *LRUCache) Get(key int) int {
    if node, ok := this.cache[key]; ok {
        this.moveToHead(node)
        return node.val
    }
    return -1
}

func (this *LRUCache) Put(key int, value int)  {
    if node, ok := this.cache[key]; ok {
        node.val = value
        this.moveToHead(node)
    } else {
        newNode := &Node{key: key, val: value}
        this.addToHead(newNode)
        this.cache[key] = newNode
        // 考虑是否超出容量限制，移除最少使用的尾部
        if len(this.cache) > this.capacity {
            tail := this.tail.prev
            this.removeNode(tail)
            delete(this.cache, tail.key)
        }
    }
}

/**
 * Your LRUCache object will be instantiated and called as such:
 * obj := Constructor(capacity);
 * param_1 := obj.Get(key);
 * obj.Put(key,value);
 */
```





### 二叉树 15

[94\. 二叉树的中序遍历](https://leetcode.cn/problems/binary-tree-inorder-traversal/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func inorderTraversal(root *TreeNode) []int {
    res := []int{}
    var inorder func(node *TreeNode)
    inorder = func(node *TreeNode) {
        if node == nil {
            return
        }
        inorder(node.Left)
        res = append(res, node.Val)
        inorder(node.Right)
    }
    inorder(root)
    return res
}
```

[104\. 二叉树的最大深度](https://leetcode.cn/problems/maximum-depth-of-binary-tree/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func maxDepth(root *TreeNode) int {
    if root == nil {
        return 0
    }
    leftD := maxDepth(root.Left)
    rightD := maxDepth(root.Right)
    if leftD < rightD {
        return rightD + 1
    }
    return leftD + 1
}
```

[226\. 翻转二叉树](https://leetcode.cn/problems/invert-binary-tree/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func invertTree(root *TreeNode) *TreeNode {
    if root == nil {
        return nil
    }
    root.Left, root.Right = root.Right, root.Left
    invertTree(root.Left)
    invertTree(root.Right)
    return root
}
```

[101\. 对称二叉树](https://leetcode.cn/problems/symmetric-tree/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func isSymmetric(root *TreeNode) bool {
    if root == nil {
        return true
    }
    return isMirror(root.Left, root.Right)
}
func isMirror(p, q *TreeNode) bool {
    if p == nil && q == nil {
        return true
    }
    if p == nil || q == nil {
        return false
    }
    return p.Val == q.Val && isMirror(p.Left, q.Right) && isMirror(p.Right, q.Left)
}
```

[543\. 二叉树的直径](https://leetcode.cn/problems/diameter-of-binary-tree/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func diameterOfBinaryTree(root *TreeNode) int {
    maxDiameter := 0
    var depth func(node *TreeNode) int 
    depth = func(node *TreeNode) int {
        if node == nil {
            return 0
        }
        leftDepth := depth(node.Left)
        rightDepth := depth(node.Right)
        if leftDepth + rightDepth > maxDiameter {
            maxDiameter = leftDepth + rightDepth
        }
        if leftDepth > rightDepth {
            return leftDepth + 1
        }
        return rightDepth + 1
    }
    depth(root)
    return maxDiameter
}
```

[102\. 二叉树的层序遍历](https://leetcode.cn/problems/binary-tree-level-order-traversal/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func levelOrder(root *TreeNode) [][]int {
    res := [][]int{}
    if root == nil {
        return res
    }
    queue := []*TreeNode{root}
    for len(queue) > 0 {
        levelSize := len(queue)
        levelVal := []int{}
        for i := 0;i < levelSize;i++ {
            node := queue[0]
            queue = queue[1:]
            levelVal = append(levelVal, node.Val)
            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }
        res = append(res, levelVal)
    }
    return res
}
```

[108\. 将有序数组转换为二叉搜索树](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/)

```SQL
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func sortedArrayToBST(nums []int) *TreeNode {
    var build func(left, right int) *TreeNode
    build = func(left, right int) *TreeNode {
        if left > right {
            return nil
        }
        mid := (left + right) / 2
        root := &TreeNode{Val: nums[mid]}
        root.Left = build(left, mid - 1)
        root.Right = build(mid + 1, right)
        return root
    }
    return build(0, len(nums)-1)
}
```

[98\. 验证二叉搜索树](https://leetcode.cn/problems/validate-binary-search-tree/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func isValidBST(root *TreeNode) bool {
    return validate(root, math.MinInt64, math.MaxInt64)
}
func validate(root *TreeNode, min, max int) bool {
    if root == nil {
        return true
    }
    if root.Val <= min || root.Val >= max {
        return false
    }
    return validate(root.Left, min, root.Val) && validate(root.Right, root.Val, max)
}
```

[230\. 二叉搜索树中第 K 小的元素](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/)

```C++
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func kthSmallest(root *TreeNode, k int) int {
    stack := []*TreeNode{}
    cur := root
    for {
        for cur != nil {
            stack = append(stack, cur)
            cur = cur.Left
        }
        cur = stack[len(stack)-1]
        stack = stack[:len(stack)-1]
        k--
        if k==0 {
            return cur.Val
        }
        cur = cur.Right
    }
}
```

[199\. 二叉树的右视图](https://leetcode.cn/problems/binary-tree-right-side-view/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func rightSideView(root *TreeNode) []int {
    res := []int{}
    var dfs func(node *TreeNode, depth int)
    dfs = func(node *TreeNode, depth int) {
        if node == nil {
            return
        }
        if depth == len(res) {
            res = append(res, node.Val)
        }
        dfs(node.Right, depth + 1)
        dfs(node.Left, depth + 1)
    }
    dfs(root, 0)
    return res
}
```

[114\. 二叉树展开为链表](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func flatten(root *TreeNode)  {
    cur := root
    for cur != nil {
        if cur.Left != nil {
            pre := cur.Left
            for pre.Right != nil {// 注意这里条件是pre.Right
                pre = pre.Right
            }
            pre.Right = cur.Right
            cur.Right = cur.Left
            cur.Left = nil
        }
        cur = cur.Right
    }
}
```

[105\. 从前序与中序遍历序列构造二叉树](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func buildTree(preorder []int, inorder []int) *TreeNode {
    inPos := make(map[int]int, len(inorder))
    for i, v := range inorder {
        inPos[v] = i
    }
    var build func(preL, preR, inL, inR int) *TreeNode
    build = func(preL, preR, inL, inR int) *TreeNode {
        if preL > preR {
            return nil
        }
        rootVal := preorder[preL]
        root := &TreeNode{Val: rootVal}
        rootIdx := inPos[rootVal]
        leftSize := rootIdx - inL // 注意这里是减去inL
        root.Left = build(preL + 1, preL + leftSize, inL, rootIdx - 1)
        root.Right = build(preL + leftSize + 1, preR, rootIdx + 1, inR)
        return root
    }
    node := build(0, len(preorder)-1, 0, len(inorder)-1)
    return node
}
```

[437\. 路径总和 III](https://leetcode.cn/problems/path-sum-iii/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func pathSum(root *TreeNode, targetSum int) int {
    prefixMap := map[int]int{0: 1}
    return dfs(root, targetSum, 0, prefixMap)
}
func dfs(node *TreeNode, target, curSum int, prefixMap map[int]int) int {
    if node == nil {
        return 0
    }
    curSum += node.Val
    count := prefixMap[curSum - target]
    prefixMap[curSum]++
    count += dfs(node.Left, target, curSum, prefixMap)
    count += dfs(node.Right, target, curSum, prefixMap)
    // 注意要恢复现场回溯
    prefixMap[curSum]--
    return count
}
```

[236\. 二叉树的最近公共祖先](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)

```SQL
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func lowestCommonAncestor(root, p, q *TreeNode) *TreeNode {
  if root == nil || root == p || root == q {
    return root
  }
  left := lowestCommonAncestor(root.Left, p, q)
  right := lowestCommonAncestor(root.Right, p, q)
  if left != nil && right != nil {
    return root
  }
  if left != nil {
    return left
  }
  return right
}
```

[124\. 二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/)

```Go
/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func maxPathSum(root *TreeNode) int {
    maxSum := math.MinInt32
    var maxGain func(node *TreeNode) int
    maxGain = func(node *TreeNode) int {
        if node == nil {
            return 0
        }
        leftGain := max(maxGain(node.Left), 0) // 避免负数拉低收益
        rightGain  := max(maxGain(node.Right), 0)
        curMaxPath := node.Val + leftGain + rightGain
        if(curMaxPath > maxSum) {
            maxSum = curMaxPath
        }
        return node.Val + max(leftGain, rightGain)
    }
    maxGain(root)
    return maxSum
}
```



### 图论 4 

[200\. 岛屿数量](https://leetcode.cn/problems/number-of-islands/)

```Go
func numIslands(grid [][]byte) int {
    m, n := len(grid), len(grid[0])
    if m == 0 || n == 0 {
        return 0
    }
    count := 0
    var dfs func(i, j int)
    dfs = func(i, j int) {
        if i < 0 || i >= m || j < 0 || j >= n || grid[i][j] != '1' {
            return
        }
        grid[i][j] = '0'
        dfs(i + 1, j)
        dfs(i - 1, j)
        dfs(i, j + 1)
        dfs(i, j - 1)
    }
    for i := 0;i < m;i++ {
        for j := 0;j < n;j++ {
            if grid[i][j] == '1' {
                count++
                dfs(i, j)
            }
        }
    }
    return count
}
```

[994\. 腐烂的橘子](https://leetcode.cn/problems/rotting-oranges/)

```Go
func orangesRotting(grid [][]int) int {
    m, n := len(grid), len(grid[0])
    freshCount := 0
    minutes := 0
    queue := [][]int{}
    for i := 0; i < m; i++ {
        for j := 0; j < n; j ++ {
            if grid[i][j] == 1 {
                freshCount++
            } else if grid[i][j] == 2 {
                queue = append(queue, []int{i, j})
            }
        }
    }
    if freshCount == 0 {
        return 0
    }
    dirs := [][]int{{-1, 0}, {1, 0}, {0,1}, {0, -1}}
    for len(queue) > 0 {
        minutes++

        size := len(queue)
        for i := 0;i < size;i++ {
            cur := queue[0]
            queue = queue[1:]
            for _, dir := range dirs {
                nx, ny := cur[0] + dir[0], cur[1] + dir[1]
                if nx >= 0 && nx < m && ny >= 0 && ny < n && grid[nx][ny] == 1 {
                    freshCount--
                    grid[nx][ny] = 2
                    queue = append(queue, []int{nx, ny})
                }
            }
        }
        if freshCount == 0 {
            return minutes
        }
    }
    return -1
}
```

[207\. 课程表](https://leetcode.cn/problems/course-schedule/)

```Go
func canFinish(numCourses int, prerequisites [][]int) bool {
    // 构建邻接表和入度数组
    adj := make([][]int, numCourses)
    inDegree := make([]int, numCourses)
    for _, p := range prerequisites {
        course, prereq := p[0], p[1]
        adj[prereq] = append(adj[prereq], course)
        inDegree[course]++
    }
    queue := []int{}
    for i := 0;i < numCourses;i++ {
        if inDegree[i] == 0 {
            queue = append(queue, i)
        }
    }
    count := 0
    for len(queue) > 0 {
        count++
        cur := queue[0]
        queue = queue[1:]
        for _, next := range adj[cur] {
            inDegree[next]--
            if inDegree[next] == 0 {
                queue = append(queue, next)
            }
        }
    }
    return count == numCourses
}
```

[208\. 实现 Trie \(前缀树\)](https://leetcode.cn/problems/implement-trie-prefix-tree/)

```Go
type Trie struct {
    root *TrieNode
}

type TrieNode struct {
    children [26]*TrieNode
    isEnd bool
}

func Constructor() Trie {
    return Trie{root: &TrieNode{}}
}

func (this *Trie) Insert(word string)  {
    node := this.root
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            node.children[idx] = &TrieNode{}
        }
        node = node.children[idx]
    }
    node.isEnd = true
}

func (this *Trie) Search(word string) bool {
    node := this.root
    for _, ch := range word {
        idx := ch - 'a'
        if node.children[idx] == nil {
            return false
        }
        node = node.children[idx]
    }
    return node.isEnd
}

func (this *Trie) StartsWith(prefix string) bool {
    node := this.root
    for _, ch := range prefix {
        idx := ch - 'a'
        if node.children[idx] == nil {
            return false
        }
        node = node.children[idx]
    }
    return true
}

/**
 * Your Trie object will be instantiated and called as such:
 * obj := Constructor();
 * obj.Insert(word);
 * param_2 := obj.Search(word);
 * param_3 := obj.StartsWith(prefix);
 */
```



### 回溯 8

[46\. 全排列](https://leetcode.cn/problems/permutations/)

```Go
func permute(nums []int) [][]int {
    res := [][]int{}
    path := []int{}
    used := make([]bool, len(nums))
    var dfs func()
    dfs = func() {
        if len(path) == len(nums) {
            // 拷贝临时数组防止回溯时path被改
            temp := make([]int, len(path)) //注意要预定义长度，不然copy一直是空切片
            copy(temp, path)
            res = append(res, temp)
            return
        }
        for i := 0;i < len(nums);i++ {
            if used[i] {
                continue
            }
            used[i] = true
            path = append(path, nums[i])
            dfs()
            used[i] = false
            path = path[:len(path)-1]
        }
    }
    dfs()
    return res
}
```

[78\. 子集](https://leetcode.cn/problems/subsets/)

```Go
func subsets(nums []int) [][]int {
    res := [][]int{}
    path := []int{}
    var dfs func(start int)
    dfs = func(start int) {
        temp := make([]int, len(path))
        copy(temp, path)
        res = append(res, temp)
        for i := start;i < len(nums);i++ {
            path = append(path, nums[i])
            dfs(i + 1)
            path = path[:len(path)-1]
        }
    }
    dfs(0)
    return res
}
```

[17\. 电话号码的字母组合](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/)



[39\. 组合总和](https://leetcode.cn/problems/combination-sum/)



[22\. 括号生成](https://leetcode.cn/problems/generate-parentheses/)



[79\. 单词搜索](https://leetcode.cn/problems/word-search/)



[131\. 分割回文串](https://leetcode.cn/problems/palindrome-partitioning/)



[51\. N 皇后](https://leetcode.cn/problems/n-queens/)

```Go
func solveNQueens(n int) [][]string {
    res := [][]string{}
    cols := make(map[int]bool)
    diag1 := make(map[int]bool)
    diag2 := make(map[int]bool)
    board := make([][]byte, n)
    for i := range board {
        board[i] = make([]byte, n)
        for j := range board[i] {
            board[i][j] = '.'
        }
    }
    var dfs func(row int)
    dfs = func(row int) {
        if row == n {
            temp := make([]string, n)
            for i := range board {
                temp[i] = string(board[i])
            }
            res = append(res, temp)
            return
        }

        for col := 0;col < n;col++ {
            d1, d2 := col + row, row - col
            if cols[col] || diag1[d1] || diag2[d2] {
                continue
            }
            board[row][col] = 'Q'
            cols[col] = true
            diag1[d1] = true
            diag2[d2] = true
            dfs(row + 1)
            board[row][col] = '.'
            delete(cols, col)
            delete(diag1, d1)
            delete(diag2, d2)
        }
    }
    dfs(0)
    return res
}
```







### 二分查找 6

**三种写法核心思想一句话对比总结：**

- `while(left <= right)`：循环到指针**交叉** \(`left > right`\)，答案在 left/right 两侧（最传统，易错）。

- `while(left < right)`：循环到指针**相遇** \(`left == right`\)，相遇点就是答案（最清晰，**最推荐**）。

- `while(left + 1 < right)`（你图片里的）：循环到指针**相邻** \(`right = left + 1`\)，`right` 天然就是答案（代码最简洁）。

二分查找不同while后面条件的辨析

left \<= right 左闭右闭的写法思想

left \< right 左闭右开的写法思想

left \+ 1 \< right 的lowerbound写法思想

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NzgxNjAwNTNjM2JmYjA0NDk4YzI1ODg0MTlhNTI3NzZfNGMxYjgyYzJjNmI0MTc5Y2EzOTM3N2JiMWQzNjk4MmFfSUQ6NzY1NzAxMTYyMzU0MjQyNjg0MV8xNzg0Njg4MzExOjE3ODQ3NzQ3MTFfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NmVlYTQ5YjgwYmY4ODk3NzRlZGRhODYzNzA4MDdkYzBfMDk3ZDY0NjI2NjY5ZjU3NmNhOWNmZjIzNzg5NjJmOTlfSUQ6NzY1NzAxMjkyMTI4NTQ0NjYzN18xNzg0Njg4MzEyOjE3ODQ3NzQ3MTJfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OTAyMzhkZDdhZTk3OWI4MzUxYTkyY2MwZmJkZDA3OTJfZWM1MjY0NmYyMzUyZWJlYzhkNjk4MjNhY2FlY2I4NmRfSUQ6NzY1NzAxMzEwMjgzNjM1NDI5M18xNzg0Njg4MzExOjE3ODQ3NzQ3MTFfVjM)

```SQL
func lowerBound(nums []int, target int) int {
    left, right := 0, len(nums)
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid
        }
    }
    return left
}
```

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MTNkMTRmMGJmM2ZlMWQ0ZjdiZjZiMGZlY2Q5M2Q2YjJfY2VmNDAxMzc1NzRlZDg5MjMyZmNiYWI4ODQ1ZTVlMDdfSUQ6NzY1NzAxMjA5Nzc2NzA1MDIwOF8xNzg0Njg4MzExOjE3ODQ3NzQ3MTFfVjM)

```Go
func lowerBound(nums []int, target int) int {
    left, right := -1, len(nums)
    for left+1 < right {           // 当 left 和 right 只剩相邻时就停止
        mid := left + (right-left)/2
        if nums[mid] < target {
            left = mid
        } else {
            right = mid
        }
    }
    return right                   // 重点：返回 right
}
```



[35\. 搜索插入位置](https://leetcode.cn/problems/search-insert-position/)

```Go
func searchInsert(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2
        if nums[mid] == target {
            return mid
        } else if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return left  // 没找到就插入left
}
```

[74\. 搜索二维矩阵](https://leetcode.cn/problems/search-a-2d-matrix/)

```Go
func searchMatrix(matrix [][]int, target int) bool {
    if len(matrix) == 0 || len(matrix[0]) == 0 {
        return false
    }
    m, n := len(matrix), len(matrix[0])
    left, right := 0, m*n-1
    for left <= right {
        mid := left + (right - left) / 2
        row, col := mid/n, mid%n // 除数是n不是m
        val := matrix[row][col]
        if val == target {
            return true
        } else if val < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return false
}
```

[34\. 在排序数组中查找元素的第一个和最后一个位置](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/)

```Go
*// lowerBound 返回数组 nums 中第一个 >= target 的下标（Lower Bound）*
*// 如果所有元素都 < target，则返回 len(nums)*
*// *
*// 核心思想（循环不变式 Loop Invariant）：*
*//   - left：指向「可能」是第一个 >= target 的位置（或其左侧）*
*//   - right：指向「已确定」是第一个 >= target 的位置（或数组末尾）*
*//   - 始终保持：left <= right，且答案一定在 [left, right) 区间内*
*//   - 当 left == right 时，两指针精准相遇，此时 left 就是答案*
func lowerBound(*nums* []int, *target* int) int {
    left, right := 0, len(nums) *// right 初始化为 len(nums)，形成左闭右开区间 [0, n)*
    *// 只要 left < right，区间就还有元素需要判断*
    *for* left < right {
        *// 防止溢出，且保证 mid 偏向 left（不会死循环）*
        mid := left + (right-left)/2
        *if* nums[mid] < target {
            *// mid 及其左边的元素都 < target，答案一定在右半部分*
            left = mid + 1
        } *else* {
            *// nums[mid] >= target，mid 有可能是答案，继续往左找更靠前的位置*
            *// 注意：这里是 right = mid，而不是 mid-1，因为 mid 可能是答案*
            right = mid
        }
        *// 重要特性：left 只会增加，right 只会减少，且 left 永远不会超过 right*
        *// 最终必然以 left == right 的形式结束循环*
    }
    *return* left *// 此时 left == right，就是 Lower Bound*
}
*// searchRange 在排序数组 nums 中查找 target 出现的第一个和最后一个位置*
*// 返回 [-1, -1] 表示 target 不存在*
func searchRange(*nums* []int, *target* int) []int {
    *if* len(nums) == 0 {
        *return* []int{-1, -1}
    }
    *// 1. 找到第一个 >= target 的位置*
    start := lowerBound(nums, target)
    *// 2. 边界检查：如果超出数组范围或该位置的值不等于 target，说明不存在*
    *if* start == len(nums) || nums[start] != target {
        *return* []int{-1, -1}
    }
    *// 3. 找到第一个 >= target+1 的位置（即 Upper Bound）*
    *// 再减 1 就是最后一个等于 target 的位置*
    end := lowerBound(nums, target+1) - 1
    *return* []int{start, end}
}
```

```Go
func searchRange(nums []int, target int) []int {
    if len(nums) == 0 {
        return []int{-1, -1}
    }
    start := lowerBound(nums, target)
    if start == len(nums) || nums[start] != target {
        return []int{-1, -1}
    }
    end := lowerBound(nums, target+1) - 1
    return []int{start, end}
}

func lowerBound(nums []int, target int) int {
    left, right := 0, len(nums)
    for left < right {
        mid := left + (right - left) / 2
        if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid  // 这里不要 - 1 , 因为right可能也是答案
        }
    }
    return right
}
```

[33\. 搜索旋转排序数组](https://leetcode.cn/problems/search-in-rotated-sorted-array/)

```Go
func search(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2
        if nums[mid] == target {
            return mid
        }
        if nums[left] <= nums[mid] {
            if nums[left] <= target && target < nums[mid] {
                right = mid - 1
            } else {
                left = mid + 1
            }
        } else {
            if nums[mid] < target && target <= nums[right] {
                left = mid + 1
            } else {
                right = mid - 1
            }
        }
    }
    return -1
}
```

[153\. 寻找旋转排序数组中的最小值](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/)

```SQL
func findMin(nums []int) int {
    left, right := 0, len(nums)-1
    for left < right {
        mid := left + (right-left)/2
        if nums[mid] < nums[right] {
            right = mid
        } else {
            left = mid + 1
        }
    }
    return nums[left]
}
```

[4\. 寻找两个正序数组的中位数](https://leetcode.cn/problems/median-of-two-sorted-arrays/)

```Go

```



### 栈 5

[20\. 有效的括号](https://leetcode.cn/problems/valid-parentheses/)

```Go
func isValid(s string) bool {
    n := len(s)
    pairs := map[byte]byte{
        ')': '(', 
        ']': '[', 
        '}': '{',
    }
    stack := []byte{}
    for i := 0; i < n; i++ {
        if pairs[s[i]] > 0 {
            if(len(stack) == 0 || stack[len(stack) - 1] != pairs[s[i]]) {
                return false
            }
            stack = stack[:len(stack) - 1]
        } else {
            stack = append(stack, s[i])
        }
    }
    return len(stack) == 0
}
```

[155\. 最小栈](https://leetcode.cn/problems/min-stack/)

```Go
type MinStack struct {
    stack []int
    minStack []int
}

func Constructor() MinStack {
    return MinStack{}
}

func (this *MinStack) Push(value int)  {
    this.stack = append(this.stack, value)
    if(len(this.minStack) == 0) {
        this.minStack = append(this.minStack, value)
    } else {
        prev := this.minStack[len(this.minStack)-1]
        if(value < prev) {
            this.minStack = append(this.minStack, value)
        } else {
            this.minStack = append(this.minStack, prev)
        }
    }
}

func (this *MinStack) Pop()  {
    this.stack = this.stack[:len(this.stack)-1]
    this.minStack = this.minStack[:len(this.minStack)-1]
}

func (this *MinStack) Top() int {
    return this.stack[len(this.stack)-1]
}

func (this *MinStack) GetMin() int {
    return this.minStack[len(this.minStack)-1]
}

/**
 * Your MinStack object will be instantiated and called as such:
 * obj := Constructor();
 * obj.Push(value);
 * obj.Pop();
 * param_3 := obj.Top();
 * param_4 := obj.GetMin();
 */
```

[394\. 字符串解码](https://leetcode.cn/problems/decode-string/)

```Go
func decodeString(s string) string {
    countStk := []int{}
    strStk := []string{}
    curNum := 0
    curStr := ""
    for _, ch := range s {
        if ch >= '0' && ch <= '9' {
            curNum = curNum * 10 + int(ch - '0')
        } else if ch == '[' {
            countStk = append(countStk, curNum)
            strStk = append(strStk, curStr)
            curNum = 0
            curStr = ""
        } else if ch == ']' {
            count := countStk[len(countStk)-1]
            countStk = countStk[:len(countStk)-1]

            prev := strStk[len(strStk)-1]
            strStk = strStk[:len(strStk)-1]

            tmp := ""
            for i := 0;i < count;i++ {
                tmp += curStr
            }
            curStr = prev + tmp
        } else {
            curStr += string(ch)
        }
    }
    return curStr
}
```

[739\. 每日温度](https://leetcode.cn/problems/daily-temperatures/)

```Go
func dailyTemperatures(temperatures []int) []int {
    n := len(temperatures)
    res := make([]int, n)
    stk := []int{}
    for i, t := range temperatures {
    // 注意是 for 不是if，可能有好几个更高的
        for len(stk) > 0 && t > temperatures[stk[len(stk)-1]] {
            top := stk[len(stk)-1]
            stk = stk[:len(stk)-1]
            res[top] = i - top
        }
        stk = append(stk, i)
    }
    return res
}
```

[84\. 柱状图中最大的矩形](https://leetcode.cn/problems/largest-rectangle-in-histogram/)

```Go
func largestRectangleArea(heights []int) int {
    heights = append([]int{0}, heights...)
    heights = append(heights, 0)
    st := []int{}
    res := 0
    for i, h := range heights {
        for len(st) > 0 && h < heights[st[len(st)-1]] {
            top := st[len(st)-1]
            st = st[:len(st)-1]

            height := heights[top]
            width := i - st[len(st)-1] - 1
            res = max(res, height*width)
        }
        st = append(st, i)
    }
    return res
}
```



### 堆 3

[215\. 数组中的第K个最大元素](https://leetcode.cn/problems/kth-largest-element-in-an-array/)

```Go

```

[347\. 前 K 个高频元素](https://leetcode.cn/problems/top-k-frequent-elements/)

```Go
func topKFrequent(nums []int, k int) []int {
    countMap := make(map[int]int, len(nums))
    for _, num := range nums {
        countMap[num]++
    }
    bucket := make([][]int, len(nums) + 1)
    for num, freq := range countMap {
        bucket[freq] = append(bucket[freq], num)
    }
    res := make([]int, 0, k)
    for i := len(nums); i >= 0; i-- {
        if len(bucket[i]) > 0 {
            res = append(res, bucket[i]...)
        }
        if len(res) >= k {
            break
        }
    }
    return res[:k]
}
```

[295\. 数据流的中位数](https://leetcode.cn/problems/find-median-from-data-stream/)

```Go

```





### 贪心算法 4

[121\. 买卖股票的最佳时机](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/)

```Go

```

[55\. 跳跃游戏](https://leetcode.cn/problems/jump-game/)

```Go

```

[45\. 跳跃游戏 II](https://leetcode.cn/problems/jump-game-ii/)

```Go

```

[763\. 划分字母区间](https://leetcode.cn/problems/partition-labels/)

```Go

```





### 动态规划 10

[70\. 爬楼梯](https://leetcode.cn/problems/climbing-stairs/)

```Go
func climbStairs(n int) int {
    if n <= 2 {
        return n
    }
    p, q := 1, 2
    for i := 3;i <= n;i++ {
        r := p+q
        p = q
        q = r
    }
    return q
}
```

[118\. 杨辉三角](https://leetcode.cn/problems/pascals-triangle/)

```Go
func generate(numRows int) [][]int {
    // 第i行有i+1个数，首尾都是1，中间部分的数=上一行同一列+上一行前一列
    res := make([][]int, numRows)
    for i := 0;i < numRows;i++ {
        // 初始化当前行
        res[i] = make([]int, i+1)
        // 填充首尾
        res[i][0] = 1
        res[i][i] = 1
        // 填充中间,如果是第0行直接不会进入这个循环，所以不用担心
        for j := 1;j < i;j++ {
            res[i][j] = res[i-1][j] + res[i-1][j-1]
        }
    }
    return res
}
```

[198\. 打家劫舍](https://leetcode.cn/problems/house-robber/)

```Go
func rob(nums []int) int {
    n := len(nums)
    if n == 0 {
        return 0
    }
    if n == 1 {
        return nums[0]
    }
    prev2 := nums[0]
    prev1 := max(nums[0], nums[1])
    for i := 2;i < n;i++ {
        cur := max(prev1, prev2 + nums[i])
        prev2 = prev1
        prev1 = cur
    }
    return prev1
}
```

[279\. 完全平方数](https://leetcode.cn/problems/perfect-squares/)

```Go
func numSquares(n int) int {
    dp  := make([]int, n+1)
    for i := 1;i <= n;i++ {
        dp[i] = math.MaxInt32
    }
    dp[0] = 0
    for i := 1;i <= n;i++ {
        for j := 1;j*j<=i;j++ {
            dp[i] = min(dp[i], dp[i-j*j]+1)
        }
    }
    return dp[n]
}
```

[322\. 零钱兑换](https://leetcode.cn/problems/coin-change/)

```Go
func coinChange(coins []int, amount int) int {
    // 先初始化为不可达状态
    dp := make([]int, amount+1)
    for i := 1;i <= amount;i++ {
        dp[i] = amount+1
    }
    dp[0] = 0
    for i := 1;i <= amount;i++ {
        for _, coin := range coins {
            if i >= coin {
                dp[i] = min(dp[i], dp[i-coin] + 1)
            }
        }
    }
    if dp[amount] == amount+1 {
        return -1
    }
    return dp[amount]
}
```

[139\. 单词拆分](https://leetcode.cn/problems/word-break/)

```Go
func wordBreak(s string, wordDict []string) bool {
    wordMap := make(map[string]bool, len(wordDict))
    for _, word := range wordDict {
        wordMap[word] = true
    }
    n:=len(s)
    dp := make([]bool, n+1)
    dp[0] = true
    for i := 1;i <= n;i++ {
        for j := 0;j < i;j++ {
            if dp[j] && wordMap[s[j:i]] {
                dp[i] = true
                break;//这里注意，只要找到一种情况，就可以直接退出内层循环
            }
        }
    }
    return dp[n]
}
```

[300\. 最长递增子序列](https://leetcode.cn/problems/longest-increasing-subsequence/)

```Go
func lengthOfLIS(nums []int) int {
    tails := make([]int, 0)
    for _,num := range nums {
        if len(tails) == 0 || num > tails[len(tails)-1] {
            tails = append(tails, num)
        } else {
            idx := sort.Search(len(tails), func(i int) bool {
                return tails[i] >= num
            })
            tails[idx] = num
        }
    }
    return len(tails)
}
```

[152\. 乘积最大子数组](https://leetcode.cn/problems/maximum-product-subarray/)

```Go
func maxProduct(nums []int) int {
    // 这题一个写法技巧是遇到负数的时候，可以当时直接翻转最大和最小。
    ans, imin, imax := nums[0], nums[0], nums[0]
    for i := 1;i < len(nums);i++ {
        x := nums[i]
        if x < 0 {
            imin, imax = imax, imin
        }
        imax = max(x, x*imax)
        imin = min(x, x*imin)
        ans = max(ans, imax)
    }
    return ans
}
```

[416\. 分割等和子集](https://leetcode.cn/problems/partition-equal-subset-sum/)

```Go
func canPartition(nums []int) bool {
    sum := 0
    for _,num := range nums {
        sum += num
    }
    if sum%2==1 {
        return false
    }
    target := sum/2
    dp := make([]bool, target+1)
    dp[0] = true
    
    for _,num := range nums {
        for j := target;j >= num;j-- { //注意这里的循环条件是 j 大于等于 num。还有注意是倒序。
            dp[j] = dp[j] || dp[j-num]
        }
    }
    return dp[target]
}
```

[32\. 最长有效括号](https://leetcode.cn/problems/longest-valid-parentheses/)

```Go
func longestValidParentheses(s string) int {
    ans := 0
    st := []int{-1}
    for i := 0;i < len(s);i++ {
        if s[i] == '(' {
            st = append(st, i)
        } else {
            st = st[:len(st)-1]
            if len(st) == 0 {
                st = append(st, i)
            } else {
                ans = max(ans, i-st[len(st)-1])
            }
        }
    }
    return ans
}
```





### 多维动态规划 5

[62\. 不同路径](https://leetcode.cn/problems/unique-paths/)

```Go
func uniquePaths(m int, n int) int {
    dp := make([][]int, m)
    for i := 0;i < m;i++ {
        dp[i] = make([]int, n)
        dp[i][0] = 1 // 初始化第一列。
    }
    for j := 0;j < n;j++ {
        dp[0][j] = 1 // 初始化第一行。
    }
    for i := 1;i < m;i++ {
        for j := 1;j < n;j++ {
            dp[i][j] = dp[i-1][j] + dp[i][j-1]
        }
    }
    return dp[m-1][n-1]
}
```

[64\. 最小路径和](https://leetcode.cn/problems/minimum-path-sum/)

```Go
func minPathSum(grid [][]int) int {
    m, n := len(grid), len(grid[0])
    dp := make([][]int, m)
    for i := 0;i < m;i++ {
        dp[i] = make([]int, n)
    }
    dp[0][0] = grid[0][0]
    for i := 1;i < m;i++ {
        dp[i][0] = dp[i-1][0] + grid[i][0]
    }
    for j := 1;j < n;j++ {
        dp[0][j] = dp[0][j-1] + grid[0][j]
    }
    for i := 1;i < m;i++ {
        for j := 1;j < n;j++ {
            dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]
        }
    }
    return dp[m-1][n-1]
}
```

[5\. 最长回文子串](https://leetcode.cn/problems/longest-palindromic-substring/)

```Go
func longestPalindrome(s string) string {
    if s == "" {
        return ""
    }
    start, maxLen := 0, 1 // 最大长度的最坏情况就是只有一个字母，所以是一。
    expand := func(l, r int) {
        for l >= 0 && r < len(s) && s[l] == s[r] {
            if r-l+1 > maxLen {
                start = l
                maxLen = r-l+1
            }
            l--
            r++
        }
    }
    for i := 0;i < len(s);i++ {
        expand(i,i) // 奇数
        expand(i, i+1) // 偶数
    }
    return s[start:start+maxLen]
}
```

[1143\. 最长公共子序列](https://leetcode.cn/problems/longest-common-subsequence/)

```Go
func longestCommonSubsequence(text1 string, text2 string) int {
    m,n := len(text1), len(text2)
    dp := make([][]int, m+1)
    for i := 0;i <= m;i++ {
        dp[i] = make([]int, n+1)
    }
    for i := 1;i <= m;i++ {
        for j := 1;j <= n;j++ {
            if text1[i-1] == text2[j-1] {
                dp[i][j] = dp[i-1][j-1] + 1
            } else {
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
            }
        }
    }
    return dp[m][n]
}
```

[72\. 编辑距离](https://leetcode.cn/problems/edit-distance/)

```Go
func minDistance(word1 string, word2 string) int {
    // 三种操作，插入、替换、删除
    // 先初始化dp数组
    m,n:=len(word1),len(word2)
    dp := make([][]int, m+1)
    for i := 0;i <= m;i++ {
        dp[i] = make([]int, n+1)
    }
    // 初始化两种初始情况，从0到完整串、从完整串到0
    for i := 0;i <= m;i++ {
        dp[i][0] = i
    }
    for j := 0;j <= n;j++ {
        dp[0][j] = j
    }
    for i := 1;i <= m;i++ {
        for j := 1;j <= n;j++ {
            if word1[i-1] == word2[j-1] {
                dp[i][j] = dp[i-1][j-1]
            } else {
                dp[i][j] = min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]) + 1
            }
        }
    }
    return dp[m][n]
}
```



### 技巧 5

[136\. 只出现一次的数字](https://leetcode.cn/problems/single-number/)

```Go
func singleNumber(nums []int) int {
    res := 0
    for _, num := range nums {
        res ^= num
    }
    return res
}
```

[169\. 多数元素](https://leetcode.cn/problems/majority-element/)

```Go
func majorityElement(nums []int) int {
    candidate, count := nums[0], 1
    // 注意循环从开始
    for i := 1; i < len(nums);i++ {
        if count == 0 {
            candidate = nums[i]
            count = 1
        } else if nums[i] == candidate {
            count++
        } else {
            count--
        }
    }
    return candidate
}
```

[75\. 颜色分类](https://leetcode.cn/problems/sort-colors/)

```Go
func sortColors(nums []int)  {
    p0, p2 := 0, len(nums) - 1
    cur := 0
    for cur <= p2 {
        if nums[cur] == 0 {
            nums[p0], nums[cur] = nums[cur], nums[p0]
            p0++
            cur++
        } else if nums[cur] == 2 {
            nums[cur], nums[p2] = nums[p2], nums[cur]
            p2--
        } else {
            cur++
        }
    }
}
```

[31\. 下一个排列](https://leetcode.cn/problems/next-permutation/)

```SQL
func nextPermutation(nums []int)  {
    n := len(nums)
    i := n-2 // 因为和i+1比的,所以从n-2开始
    for i >= 0 && nums[i] >= nums[i+1] {
        i--
    }
    if i >= 0 {
        j := n-1
        for j >= 0 && nums[j] <= nums[i] {
            j--
        }
        nums[i], nums[j] = nums[j], nums[i]
    }
    left, right := i+1, n-1
    for  left < right {
        nums[left], nums[right] = nums[right], nums[left]
        left++
        right--
    }
}
```

[287\. 寻找重复数](https://leetcode.cn/problems/find-the-duplicate-number/)

```Go
func findDuplicate(nums []int) int {
    slow, fast := nums[0], nums[0]
    for {
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast {
            break
        }
    }
    fast = nums[0]
    for slow != fast {
        slow = nums[slow]
        fast = nums[fast]
    }
    return slow
}
```







### template

```Go
type MinHeap []int
func (h MinHeap) Len() int
func (h MinHeap) Less(i, j int) bool {return h[i] < h[j]}
func (h MinHeap) Swap(i, j int) {h[i], h[j] = h[j], h[i]}
func (h *MinHeap) Push(x interface{}) {*h = append(*h, x.(int)}
func (h *MinHeap) Pop() interface{} {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}
```



