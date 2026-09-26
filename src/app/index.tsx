
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/database/supabase';
import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tarea = {
  id: number;
  nombre: string;
  fecha: string;
  responsable: string;
};

export default function HomeScreen() {
  const theme = useTheme();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [pantalla, setPantalla] = useState('inicio');
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [responsable, setResponsable] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);

  const cargarTareas = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('ListaTareas')
      .select('*')
      .order('id');

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTareas((data ?? []) as Tarea[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  const nuevaTarea = () => {
    setTareaEditando(null);
    setNombre('');
    setFecha('');
    setResponsable('');
    setPantalla('crear');
  };

  const editarTarea = (tarea: Tarea) => {
    setTareaEditando(tarea);
    setNombre(tarea.nombre);
    setFecha(tarea.fecha);
    setResponsable(tarea.responsable);
    setPantalla('crear');
  };

  const guardarTarea = async () => {
    if (!nombre.trim() || !fecha.trim() || !responsable.trim()) {
      Alert.alert('Datos incompletos', 'Completa todos los campos.');
      return;
    }

    setGuardando(true);

    const datos = {
      nombre: nombre.trim(),
      fecha: fecha.trim(),
      responsable: responsable.trim(),
    };

    if (tareaEditando) {
      const { data, error } = await supabase
        .from('ListaTareas')
        .update(datos)
        .eq('id', tareaEditando.id)
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setTareas((actuales) =>
          actuales.map((item) =>
            item.id === tareaEditando.id ? (data as Tarea) : item
          )
        );
        setPantalla('inicio');
        setTareaEditando(null);
        setNombre('');
        setFecha('');
        setResponsable('');
      }
    } else {
      const { data, error } = await supabase
        .from('ListaTareas')
        .insert(datos)
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setTareas((actuales) => [...actuales, data as Tarea]);
        setPantalla('inicio');
        setNombre('');
        setFecha('');
        setResponsable('');
      }
    }

    setGuardando(false);
  };

  const eliminarTarea = async (tarea: Tarea) => {
    const { error } = await supabase
      .from('ListaTareas')
      .delete()
      .eq('id', tarea.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTareas((actuales) =>
        actuales.filter((item) => item.id !== tarea.id)
      );
    }
  };

  const confirmarEliminacion = (tarea: Tarea) => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(`¿Deseas eliminar "${tarea.nombre}"?`)) {
        eliminarTarea(tarea);
      }
      return;
    }

    Alert.alert('Eliminar tarea', `¿Deseas eliminar "${tarea.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => eliminarTarea(tarea),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Tarea }) => (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.cardInfo}>
        <ThemedText type="smallBold">{item.nombre}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Fecha: {item.fecha}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Responsable: {item.responsable}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => pressed && styles.pressed}
          onPress={() => editarTarea(item)}
        >
          <ThemedView type="backgroundSelected" style={styles.editButton}>
            <ThemedText type="smallBold">Editar</ThemedText>
          </ThemedView>
        </Pressable>

        <Pressable
          style={({ pressed }) => pressed && styles.pressed}
          onPress={() => confirmarEliminacion(item)}
        >
          <ThemedView style={styles.deleteButton}>
            <ThemedText type="small" style={styles.deleteButtonText}>
              Eliminar
            </ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {pantalla === 'inicio' ? (
          <>
            <ThemedView style={styles.header}>
              <ThemedText type="title">Lista de tareas</ThemedText>
              <Pressable
                style={({ pressed }) => pressed && styles.pressed}
                onPress={nuevaTarea}
              >
                <ThemedView type="backgroundSelected" style={styles.newTaskButton}>
                  <ThemedText type="smallBold">+ Nueva tarea</ThemedText>
                </ThemedView>
              </Pressable>
            </ThemedView>

            {loading ? (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyText}
              >
                Cargando tareas...
              </ThemedText>
            ) : tareas.length === 0 ? (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyText}
              >
                No hay tareas registradas.
              </ThemedText>
            ) : (
              <FlatList
                data={tareas}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        ) : (
          <>
            <ThemedView style={styles.header}>
              <ThemedText type="title">
                {tareaEditando ? 'Editar tarea' : 'Nueva tarea'}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.form}>
              <ThemedView type="backgroundElement" style={styles.field}>
                <ThemedText type="smallBold">Nombre</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.background, color: theme.text },
                  ]}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre de la tarea"
                  placeholderTextColor={theme.textSecondary}
                />
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.field}>
                <ThemedText type="smallBold">Fecha</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.background, color: theme.text },
                  ]}
                  value={fecha}
                  onChangeText={setFecha}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                />
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.field}>
                <ThemedText type="smallBold">Responsable</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.background, color: theme.text },
                  ]}
                  value={responsable}
                  onChangeText={setResponsable}
                  placeholder="Nombre del responsable"
                  placeholderTextColor={theme.textSecondary}
                />
              </ThemedView>

              <Pressable
                disabled={guardando}
                style={({ pressed }) => pressed && styles.pressed}
                onPress={guardarTarea}
              >
                <ThemedView type="backgroundSelected" style={styles.saveButton}>
                  <ThemedText type="smallBold">
                    {guardando
                      ? 'Guardando...'
                      : tareaEditando
                        ? 'Guardar cambios'
                        : 'Guardar tarea'}
                  </ThemedText>
                </ThemedView>
              </Pressable>

              <Pressable
                style={({ pressed }) => pressed && styles.pressed}
                onPress={() => {
                  setPantalla('inicio');
                  setTareaEditando(null);
                }}
              >
                <ThemedView style={styles.cancelButton}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Cancelar
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </ThemedView>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    alignSelf: 'stretch',
  },
  newTaskButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center', marginTop: Spacing.five },
  listContent: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  cardInfo: { flex: 1, gap: Spacing.half },
  cardActions: {
    gap: Spacing.two,
  },
  editButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#FFFFFF', fontWeight: '700' },
  pressed: { opacity: 0.7 },
  form: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  field: { gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});