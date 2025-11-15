// src/Auth.jsx
import React, { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  async function signUp() {
    if (!email || !password) return alert('email + senha')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return alert(error.message)
    // create profile row using anon key (or use server function)
    // attempt to create profile immediately (supabase will reject if user not confirmed)
    try {
      const userId = data.user?.id
      if (userId) {
        await supabase.from('profiles').insert({ id: userId, nome: name || email.split('@')[0] })
      }
    } catch(e){}
    alert('Confirma o email (se for necessário).')
    setMode('login')
  }

  async function signIn() {
    if (!email || !password) return alert('email + senha')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert(error.message)
    const { data } = await supabase.auth.getSession()
    onAuth?.(data.session)
  }

  async function signOut() {
    await supabase.auth.signOut()
    onAuth?.(null)
  }

  return (
    <div style={{padding:12}}>
      {mode === 'signup' ? (
        <>
          <h3>Registar</h3>
          <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div style={{marginTop:8}}>
            <button onClick={signUp}>Criar conta</button>
            <button onClick={()=>setMode('login')}>Voltar</button>
          </div>
        </>
      ) : (
        <>
          <h3>Entrar</h3>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div style={{marginTop:8}}>
            <button onClick={signIn}>Entrar</button>
            <button onClick={()=>setMode('signup')}>Registar</button>
          </div>
        </>
      )}
      <div style={{marginTop:10}}>
        <button onClick={signOut}>Sair</button>
      </div>
    </div>
  )
  }
