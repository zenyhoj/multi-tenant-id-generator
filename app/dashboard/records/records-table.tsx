'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { deleteRecord } from '@/app/records/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, Edit, Trash2, CreditCard } from 'lucide-react'

interface RecordsTableProps {
    records: any[]
}

export function RecordsTable({ records }: RecordsTableProps) {
    const router = useRouter()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const toggleSelectAll = () => {
        if (selectedIds.size === records.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(records.map(r => r.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return
        setIsDeleting(id)
        const result = await deleteRecord(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Record deleted')
        }
        setIsDeleting(null)
    }

    const handleBulkGenerate = () => {
        const ids = Array.from(selectedIds).join(',')
        router.push(`/dashboard/records/generate?ids=${ids}`)
    }

    return (
        <div>
            {selectedIds.size > 0 && (
                <div className="bg-muted/50 p-4 rounded-t-md border-x border-t flex justify-between items-center">
                    <span className="font-medium">{selectedIds.size} records selected</span>
                    <Button onClick={handleBulkGenerate}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Generate {selectedIds.size} IDs
                    </Button>
                </div>
            )}

            <div className="bg-white rounded-md border rounded-t-none">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={selectedIds.size === records.length && records.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Employee No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Division</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records?.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(record.id)}
                                        onCheckedChange={() => toggleSelect(record.id)}
                                    />
                                </TableCell>
                                <TableCell>{record.employee_no}</TableCell>
                                <TableCell className="font-medium">{record.last_name}, {record.first_name} {record.middle_name}</TableCell>
                                <TableCell>{record.position}</TableCell>
                                <TableCell>{record.division}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {/* Individual Generate */}
                                        <Link href={`/dashboard/records/${record.id}/generate`}>
                                            <Button variant="outline" size="icon" title="Generate ID">
                                                <CreditCard className="h-4 w-4" />
                                            </Button>
                                        </Link>

                                        {/* Edit */}
                                        <Link href={`/dashboard/records/${record.id}/edit`}>
                                            <Button variant="ghost" size="icon" title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>

                                        {/* Delete */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Delete"
                                            onClick={() => handleDelete(record.id)}
                                            disabled={isDeleting === record.id}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            {isDeleting === record.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!records || records.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
