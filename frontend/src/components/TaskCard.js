import React from 'react';

function TaskCard({ task, onUpdate, onDelete }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      backgroundColor: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px' }}>{task.title}</h3>
          {task.description && <p style={{ margin: '5px 0', color: '#666' }}>{task.description}</p>}
          <div style={{ marginTop: 10 }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: getStatusColor(task.status),
              color: 'white',
              marginRight: 10
            }}>
              {task.status.replace('_', ' ')}
            </span>
            <span style={{
              display: 'inline-block',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: '#e0e0e0',
              color: '#333'
            }}>
              Priority: {task.priority}
            </span>
          </div>
        </div>
        <div>
          <select
            value={task.status}
            onChange={(e) => onUpdate(task.id, e.target.value)}
            style={{ padding: 5, marginRight: 10 }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={() => onDelete(task.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
