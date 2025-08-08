import TaskDetailsClient from "@/components/clients/TaskDetailsClient";

export default function TaskDetailPage({ params }: { params: { id: string } }) {
    return <TaskDetailsClient taskId={params.id} />;
}
