import { useEffect, useRef, useState } from "react";
import { Check, Plus, Loader2 } from "lucide-react";
import {
  fetchFavoriteLists, fetchListsForHotel, createFavoriteList, addToFavoriteList, removeFromFavoriteList,
} from "../api/client";

// popup sa listama favorita, moze se napraviti nova lista odavde
export default function FavoriteListPicker({ userId, hotel, onClose, onChanged }) {
  const [lists, setLists] = useState([]);
  const [memberListIds, setMemberListIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    Promise.all([fetchFavoriteLists(userId), fetchListsForHotel(userId, hotel.dbId)]).then(
      ([allLists, memberIds]) => {
        setLists(allLists);
        setMemberListIds(memberIds);
        setLoading(false);
      }
    );
  }, [userId, hotel.dbId]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const toggleList = async (e, listId) => {
    e.preventDefault();
    e.stopPropagation();
    const isMember = memberListIds.includes(listId);
    const nextMemberIds = isMember
      ? memberListIds.filter((id) => id !== listId)
      : [...memberListIds, listId];
    setMemberListIds(nextMemberIds);
    if (isMember) {
      await removeFromFavoriteList(listId, hotel.dbId);
    } else {
      await addToFavoriteList(userId, hotel.dbId, listId);
    }
    onChanged?.(nextMemberIds.length > 0);
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newName.trim()) return;
    const created = await createFavoriteList(userId, newName.trim());
    await addToFavoriteList(userId, hotel.dbId, created.id);
    setLists((prev) => [...prev, created]);
    setMemberListIds((prev) => [...prev, created.id]);
    setNewName("");
    setCreating(false);
    onChanged?.(true);
  };

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="absolute right-0 top-full z-[1100] mt-2 w-56 rounded-md border border-line bg-white p-2 card-shadow"
    >
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Sačuvaj u listu</p>

      {loading ? (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted">
          <Loader2 size={13} className="animate-spin" /> Učitavanje...
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={(e) => toggleList(e, l.id)}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-ink hover:bg-sky-bg"
            >
              {l.name}
              {memberListIds.includes(l.id) && <Check size={14} className="text-brand" />}
            </button>
          ))}
        </div>
      )}

      {creating ? (
        <form onSubmit={handleCreateAndAdd} className="mt-1 flex items-center gap-1 px-1" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Naziv liste..."
            className="w-full rounded-md border border-line px-2 py-1.5 text-xs outline-none focus:border-brand"
          />
          <button type="submit" className="rounded-md bg-brand px-2 py-1.5 text-xs font-semibold text-white">
            OK
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCreating(true);
          }}
          className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-left text-xs font-medium text-brand hover:bg-sky-bg"
        >
          <Plus size={13} /> Nova lista
        </button>
      )}
    </div>
  );
}
