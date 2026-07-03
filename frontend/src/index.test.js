test('index rend l\'application', () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  
  require('./index');
  expect(document.getElementById('root')).toBeInTheDocument();
});
