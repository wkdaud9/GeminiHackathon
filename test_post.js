async function test() {
  const res = await fetch('http://127.0.0.1:8000/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'd20886f3-e039-4430-b129-015627096f1a',
      goal_number: 1,
      title: 'JS Test Goal',
      description: ''
    })
  });
  console.log(res.status, await res.text());
}
test();
