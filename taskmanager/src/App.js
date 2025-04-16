import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });
  const [auth, setAuth] = useState({ email: '', password: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registration, setRegistration] = useState({ name: '', email: '', password: '' });
  const [sortCriteria, setSortCriteria] = useState('dueDate');
  const [filterCriteria, setFilterCriteria] = useState({ priority: '', status: '', category: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
    }
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTask,
          priority: 'medium', // Add required fields
          category: 'work'
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task');
      }

      setTasks(prevTasks => [...prevTasks, data]);
      setNewTask({ title: '', description: '', dueDate: '' });
    } catch (error) {
      console.error('Error creating task:', error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(auth),
        credentials: 'same-origin'  // Changed from 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setIsLoggedIn(true);
      fetchTasks();
    } catch (error) {
      console.error('Login error:', error.message);
      alert(error.message); // Add user feedback
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...registration,
          role: 'user' // Add default role
        })
      });

      // First check if the response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Registration failed - Server error'
        }));
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json().catch(() => ({
        message: 'Registration successful'
      }));

      alert(data.message || 'Registration successful!');
      setIsRegistering(false);
      // Clear form
      setRegistration({ name: '', email: '', password: '' });
    } catch (error) {
      console.error('Registration error:', error.message);
      alert(error.message); // Show error to user
    }
  };

  const handleSort = (criteria) => {
    setSortCriteria(criteria);
    const sortedTasks = [...tasks].sort((a, b) => {
      if (criteria === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return a[criteria].localeCompare(b[criteria]);
    });
    setTasks(sortedTasks);
  };

  const handleFilter = () => {
    const filteredTasks = tasks.filter(task => {
      return (!filterCriteria.priority || task.priority === filterCriteria.priority) &&
             (!filterCriteria.status || task.status === filterCriteria.status) &&
             (!filterCriteria.category || task.category === filterCriteria.category);
    });
    setTasks(filteredTasks);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const searchResults = tasks.filter(task => 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      task.description.toLowerCase().includes(query.toLowerCase())
    );
    setTasks(searchResults);
  };

  const renderLoginForm = () => (
    <div className="auth-form">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={auth.email}
          onChange={(e) => setAuth({...auth, email: e.target.value})}
        />
        <input
          type="password"
          placeholder="Password"
          value={auth.password}
          onChange={(e) => setAuth({...auth, password: e.target.value})}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );

  const renderRegistrationForm = () => (
    <div className="auth-form">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          value={registration.name}
          onChange={(e) => setRegistration({...registration, name: e.target.value})}
        />
        <input
          type="email"
          placeholder="Email"
          value={registration.email}
          onChange={(e) => setRegistration({...registration, email: e.target.value})}
        />
        <input
          type="password"
          placeholder="Password"
          value={registration.password}
          onChange={(e) => setRegistration({...registration, password: e.target.value})}
        />
        <button type="submit">Register</button>
        <button type="button" onClick={() => setIsRegistering(false)}>Back to Login</button>
      </form>
    </div>
  );

  const renderFilters = () => (
    <div className="filters">
      <select onChange={(e) => setFilterCriteria({...filterCriteria, priority: e.target.value})}>
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select onChange={(e) => setFilterCriteria({...filterCriteria, status: e.target.value})}>
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      <select onChange={(e) => setFilterCriteria({...filterCriteria, category: e.target.value})}>
        <option value="">All Categories</option>
        <option value="work">Work</option>
        <option value="personal">Personal</option>
        <option value="other">Other</option>
      </select>
      <button onClick={handleFilter}>Apply Filters</button>
    </div>
  );

  return (
    <div className="App">
      <h1>Task Manager</h1>
      
      {!isLoggedIn ? (
        isRegistering ? renderRegistrationForm() : (
          <>
            {renderLoginForm()}
            <button onClick={() => setIsRegistering(true)}>Register</button>
          </>
        )
      ) : (
        <>
          <div className="search-sort">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <select onChange={(e) => handleSort(e.target.value)}>
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
          {renderFilters()}
          <div className="task-form">
            <h2>Add New Task</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
              <input
                type="text"
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              />
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
              <button type="submit">Add Task</button>
            </form>
          </div>

          <div className="tasks-list">
            <h2>Your Tasks</h2>
            {tasks.map((task) => (
              <div key={task._id} className="task-item">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                <p>Status: {task.status}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
