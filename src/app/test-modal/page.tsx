'use client'

import { useState } from 'react'
import { CreateChildModal } from '@/components/CreateChildModal'

export default function TestModalPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Modal Test Page</h1>
      
      <div className="mb-4">
        <p>Modal state: {showModal ? 'OPEN' : 'CLOSED'}</p>
      </div>

      <button 
        onClick={() => {
          console.log('Button clicked!')
          setShowModal(true)
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Open Modal (Regular Button)
      </button>

      {showModal && (
        <div>
          <p className="text-red-500 mt-4">Modal should be visible now!</p>
          <CreateChildModal onClose={() => setShowModal(false)} />
        </div>
      )}
    </div>
  )
}
