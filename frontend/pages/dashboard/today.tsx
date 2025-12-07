import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Task = {
  id: string;
  title: string | null;
  type: string;
  status: string;
  application_id: string;
  due_at: string;
};

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    setError(null);

    // What has been done:
    // - Query tasks that are due today and not completed
    // - date filtering using SQL

    try {
      const start=new Date();
      start.setHours(0,0,0,0);
      const end=new Date();
      end.setHours(23,59,59,999);
      const {data, error}=await supabase
      .from("tasks")
      .select("id, title, type, status, application_id, due_at")
      .gte("due_at",start.toISOString())
      .lte("due_at",end.toISOString())
      .neq("status", "completed")
      .order("due_at", {ascending: true});

      if(error){
        console.error("Error fetching tasks:",error);
        setError("Failed to load tasks");
        setTasks([]);
        return;
      }

      setTasks((data || []) as Task[]);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(id: string) {
    try {
      // DONE:
      // - Updated task.status to 'completed'
      // - Re-fetch tasks or update state optimistically

      const {error}=await supabase
      .from("tasks")
      .update({status:"completed"})
      .eq("id",id);

      if(error){
        console.error("Error updating task:", error);
        alert("Failed to update task");
        return;
      }

      //refetch the updated tasks
      await fetchTasks();
    } catch (err: any) {
      console.error(err);
      alert("Failed to update task");
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Today&apos;s Tasks</h1>
      {tasks.length === 0 && <p>No tasks due today 🎉</p>}

      {tasks.length > 0 && (
        <table>
          <thead>
            <tr>
            <th>Title</th>
              <th>Type</th>
              <th>Application</th>
              <th>Due At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title || "(No title)"}</td>
                <td>{t.type}</td>
                <td>{t.application_id}</td>
                <td>{new Date(t.due_at).toLocaleString()}</td>
                <td>{t.status}</td>
                <td>
                  {t.status !== "completed" && (
                    <button onClick={() => markComplete(t.id)}>
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
